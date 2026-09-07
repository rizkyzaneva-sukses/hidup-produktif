'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const MODES = [
  { label: 'Pomodoro', duration: 25 * 60, color: 'text-red-400', bg: 'bg-red-500/20', ring: 'border-red-500/50' },
  { label: 'Short Break', duration: 5 * 60, color: 'text-green-400', bg: 'bg-green-500/20', ring: 'border-green-500/50' },
  { label: 'Long Break', duration: 15 * 60, color: 'text-blue-400', bg: 'bg-blue-500/20', ring: 'border-blue-500/50' },
];

const STORAGE_KEY = 'focus_state';
const SOUND_STORAGE_KEY = 'focus_ambient_sound';
const VOLUME_STORAGE_KEY = 'focus_ambient_volume';

const SOUNDS = [
  { id: 'none', label: 'None', emoji: '🔇' },
  { id: 'white-noise', label: 'White Noise', emoji: '🌫️' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'nature', label: 'Nature', emoji: '🐦' },
] as const;

type SoundId = typeof SOUNDS[number]['id'];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatFocusTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  return `${h}j ${m}m`;
}

function todayDateStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== todayDateStr()) return null;
    return data;
  } catch { return null; }
}

function saveStorage(completedPomodoros: number, logs: any[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: todayDateStr(),
      completedPomodoros,
      logs,
    }));
  } catch {}
}

export default function FocusPage() {
  const qc = useQueryClient();
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [logs, setLogs] = useState<{ task: string; time: string; mode: string }[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [breakBanner, setBreakBanner] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  // Ambient audio state
  const [soundId, setSoundId] = useState<SoundId>('none');
  const [volume, setVolume] = useState(0.5);
  const ambientNodesRef = useRef<{ nodes: AudioNode[]; ctx: AudioContext; cleanups: (() => void)[] } | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-focus'],
    queryFn: () => fetcher('/api/tasks?completed=false'),
  });

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: weekSessions = [] } = useQuery({
    queryKey: ['focus-sessions', weekStart],
    queryFn: () => fetcher(`/api/focus-sessions?from=${weekStart}`),
  });

  const weeklyTotalMinutes = weekSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadStorage();
    if (stored) {
      setCompletedPomodoros(stored.completedPomodoros || 0);
      setLogs(stored.logs || []);
    }
    // Load sound preference
    try {
      const savedSound = localStorage.getItem(SOUND_STORAGE_KEY);
      if (savedSound && SOUNDS.some(s => s.id === savedSound)) {
        setSoundId(savedSound as SoundId);
      }
      const savedVol = localStorage.getItem(VOLUME_STORAGE_KEY);
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) setVolume(v);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const mode = MODES[modeIdx];

  useEffect(() => {
    setTimeLeft(mode.duration);
    setRunning(false);
    sessionStartRef.current = Date.now();
  }, [modeIdx]);

  // Save session to DB
  const saveSession = async (modeLabel: string, startTime: number, endTime: number) => {
    try {
      await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTaskId || undefined,
          mode: modeLabel,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          duration_minutes: Math.round((endTime - startTime) / 60000),
          date: todayDateStr(),
        }),
      });
      qc.invalidateQueries({ queryKey: ['focus-sessions'] });
    } catch {}
  };

  // ─── Ambient Audio Engine ──────────────────────────────────────

  const stopAmbient = useCallback(() => {
    if (ambientNodesRef.current) {
      const { nodes, ctx, cleanups } = ambientNodesRef.current;
      // Run cleanup functions (bird chirp intervals, etc.)
      cleanups.forEach(fn => fn());
      // Fade out all gain nodes
      nodes.forEach(node => {
        if (node instanceof GainNode) {
          node.gain.cancelScheduledValues(ctx.currentTime);
          node.gain.setValueAtTime(node.gain.value, ctx.currentTime);
          node.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        }
      });
      // Disconnect and close after fade
      setTimeout(() => {
        nodes.forEach(node => {
          try { node.disconnect(); } catch {}
        });
        ctx.close();
      }, 600);
      ambientNodesRef.current = null;
    }
  }, []);

  const startAmbient = useCallback((sound: SoundId, vol: number) => {
    if (sound === 'none') return;
    // Stop any existing ambient
    stopAmbient();

    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const allNodes: AudioNode[] = [masterGain];
    const cleanups: (() => void)[] = [];

    if (sound === 'white-noise') {
      // White noise: random samples in a buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(masterGain);
      source.start();
      allNodes.push(source);
    } else if (sound === 'rain') {
      // Rain: white noise → lowpass filter with a secondary softer layer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);

      // Secondary softer layer for texture
      const source2 = ctx.createBufferSource();
      source2.buffer = buffer;
      source2.loop = true;
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);

      source.connect(filter);
      filter.connect(masterGain);
      source.start();

      source2.connect(gain2);
      gain2.connect(filter);
      source2.start();

      allNodes.push(source, filter, source2, gain2);
    } else if (sound === 'nature') {
      // Nature: modulated oscillators simulating bird chirps over a wind layer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Ambient wind/hum layer
      const windSource = ctx.createBufferSource();
      windSource.buffer = buffer;
      windSource.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(400, ctx.currentTime);
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.15, ctx.currentTime);
      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      windSource.start();
      allNodes.push(windSource, windFilter, windGain);

      // Bird chirps using oscillators with scheduled frequency changes
      const createBird = (baseFreq: number, chirpInterval: number, chirpOffset: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const birdGain = ctx.createGain();
        birdGain.gain.setValueAtTime(0, ctx.currentTime);

        osc.connect(birdGain);
        birdGain.connect(masterGain);
        osc.start();

        let refillTimer: ReturnType<typeof setInterval> | null = null;

        // Schedule chirps
        const scheduleChirps = (startTime: number) => {
          for (let i = 0; i < 500; i++) {
            const t = startTime + chirpOffset + i * chirpInterval + Math.random() * 0.3;
            const dur = 0.08 + Math.random() * 0.06;
            const freq = baseFreq + Math.random() * 200 - 100;
            const vol = 0.06 + Math.random() * 0.04;

            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.linearRampToValueAtTime(freq + 300, t + dur * 0.3);
            osc.frequency.linearRampToValueAtTime(freq + 100, t + dur * 0.7);
            osc.frequency.linearRampToValueAtTime(freq, t + dur);

            birdGain.gain.setValueAtTime(vol, t);
            birdGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          }
        };
        // Schedule initial batch
        scheduleChirps(ctx.currentTime);
        // Refill periodically
        refillTimer = setInterval(() => {
          scheduleChirps(ctx.currentTime);
        }, 30000);

        allNodes.push(osc, birdGain);
        return () => {
          if (refillTimer) clearInterval(refillTimer);
          try { osc.stop(); } catch {}
        };
      };

      cleanups.push(createBird(2000, 1.2, 0));
      cleanups.push(createBird(2800, 1.8, 0.6));
      cleanups.push(createBird(3500, 2.5, 1.2));
    }

    ambientNodesRef.current = { nodes: allNodes, ctx, cleanups };
  }, [stopAmbient]);

  // Cleanup ambient on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, [stopAmbient]);

  // Start/stop ambient based on running state
  useEffect(() => {
    if (running && soundId !== 'none') {
      startAmbient(soundId, volume);
    } else if (!running) {
      stopAmbient();
    }
  }, [running, soundId, volume, startAmbient, stopAmbient]);

  // Update volume on the fly if already playing
  useEffect(() => {
    if (ambientNodesRef.current) {
      const { nodes } = ambientNodesRef.current;
      const masterGain = nodes[0] as GainNode;
      if (masterGain && masterGain instanceof GainNode) {
        masterGain.gain.cancelScheduledValues(0);
        masterGain.gain.setValueAtTime(volume, 0);
      }
    }
  }, [volume]);

  const selectSound = (id: SoundId) => {
    setSoundId(id);
    try { localStorage.setItem(SOUND_STORAGE_KEY, id); } catch {}
    // If timer is running, restart ambient with new sound
    if (running) {
      if (id === 'none') {
        stopAmbient();
      } else {
        startAmbient(id, volume);
      }
    }
  };

  const selectVolume = (v: number) => {
    setVolume(v);
    try { localStorage.setItem(VOLUME_STORAGE_KEY, String(v)); } catch {}
  };

  // ─── Timer ─────────────────────────────────────────────────────

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            stopAmbient();
            playDing();
            const endTime = Date.now();

            if (modeIdx === 0) {
              setCompletedPomodoros(c => {
                const next = c + 1;
                setLogs(prevLogs => {
                  const task = tasks.find((t: any) => t.id === selectedTaskId);
                  const newLog = {
                    task: task?.title || '—',
                    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    mode: 'Pomodoro',
                  };
                  const newLogs = [newLog, ...prevLogs.slice(0, 19)];
                  saveStorage(next, newLogs);
                  return newLogs;
                });
                return next;
              });
              saveSession('Pomodoro', sessionStartRef.current, endTime);
              setBreakBanner(true);
              setTimeout(() => {
                setBreakBanner(false);
                setModeIdx(1);
              }, 3000);
            } else {
              const breakLabel = modeIdx === 1 ? 'Short Break' : 'Long Break';
              saveSession(breakLabel, sessionStartRef.current, endTime);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, modeIdx, selectedTaskId, tasks, stopAmbient]);

  const playDing = () => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const reset = () => {
    setRunning(false);
    stopAmbient();
    setTimeLeft(mode.duration);
  };

  const clearDay = () => {
    setCompletedPomodoros(0);
    setLogs([]);
    saveStorage(0, []);
  };

  const pct = ((mode.duration - timeLeft) / mode.duration) * 100;
  const circumference = 2 * Math.PI * 90;
  const totalFocusMinutes = completedPomodoros * 25;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      {/* Break reminder banner */}
      {breakBanner && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center gap-2 animate-pulse">
          <span className="text-xl">🎉</span>
          <p className="text-sm text-green-300 font-medium flex-1">Time for a break! Bersantai sejenak...</p>
          <button onClick={() => setBreakBanner(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold text-white">Focus Mode</h1>
          <p className="text-slate-400 text-sm">Teknik Pomodoro untuk kerja fokus</p>
        </div>
        {hydrated && completedPomodoros > 0 && (
          <button onClick={clearDay} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Reset hari ini
          </button>
        )}
      </div>

      {/* Total focus time today */}
      {hydrated && completedPomodoros > 0 && (
        <div className="mb-5 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total fokus hari ini</p>
            <p className="text-lg font-bold text-red-400">{formatFocusTime(totalFocusMinutes)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Pomodoro selesai</p>
            <p className="text-2xl font-bold text-white">{completedPomodoros} 🍅</p>
          </div>
        </div>
      )}

      {/* Total minggu ini */}
      {weeklyTotalMinutes > 0 && (
        <div className="mb-5 mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total minggu ini</p>
            <p className="text-lg font-bold text-blue-400">{formatFocusTime(weeklyTotalMinutes)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Sesi dari DB</p>
            <p className="text-2xl font-bold text-white">{weekSessions.length} ⏱</p>
          </div>
        </div>
      )}

      {/* ─── Sound Picker ──────────────────────────────────── */}
      <div className="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎵</span>
          <h2 className="text-sm font-medium text-slate-300">Ambient Sound</h2>
          {running && soundId !== 'none' && (
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Playing</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SOUNDS.map(s => (
            <button key={s.id} onClick={() => selectSound(s.id)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                soundId === s.id
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-slate-700/30 border border-transparent text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
              }`}>
              <span className="text-xl">{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        {soundId !== 'none' && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-slate-500 text-xs">🔈</span>
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={e => selectVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 appearance-none bg-slate-700 rounded-full cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400
                         [&::-webkit-slider-thumb]:hover:bg-blue-300 [&::-webkit-slider-thumb]:transition-colors
                         [&::-webkit-slider-thumb]:shadow-md" />
            <span className="text-slate-500 text-xs">🔊</span>
            <span className="text-xs text-slate-500 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg mb-6">
        {MODES.map((m, i) => (
          <button key={m.label} onClick={() => setModeIdx(i)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${modeIdx === i ? `${m.bg} ${m.color}` : 'text-slate-400 hover:text-white'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor"
              strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference - (pct / 100) * circumference}
              className={mode.color} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-mono font-bold ${mode.color}`}>{formatTime(timeLeft)}</span>
            <span className="text-slate-400 text-sm mt-1">{mode.label}</span>
            {completedPomodoros > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap justify-center max-w-[100px]">
                {Array.from({ length: Math.min(completedPomodoros, 8) }).map((_, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-red-400" />
                ))}
                {completedPomodoros > 8 && <span className="text-xs text-red-400">+{completedPomodoros - 8}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center mb-6">
        <button onClick={() => setRunning(!running)}
          className={`w-16 h-16 rounded-full text-2xl font-bold transition-all shadow-lg ${running ? 'bg-slate-700 hover:bg-slate-600 text-white' : `${mode.bg} border-2 ${mode.ring} ${mode.color} hover:scale-105`}`}>
          {running ? '⏸' : '▶'}
        </button>
        <button onClick={reset} className="w-12 h-12 self-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 text-xl">⏹</button>
      </div>

      {/* Task selector */}
      <div className="mb-5">
        <label className="text-sm text-slate-400 block mb-2">Task yang sedang dikerjakan</label>
        <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">— Pilih task —</option>
          {tasks.map((t: any) => (
            <option key={t.id} value={t.id}>[{t.role}] {t.title}</option>
          ))}
        </select>
      </div>

      {/* Session log */}
      {hydrated && logs.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Log Sesi Hari Ini</h2>
          <div className="space-y-1.5">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-red-400 flex-shrink-0">🍅</span>
                <span className="text-slate-300 flex-1 truncate">{log.task}</span>
                <span className="text-slate-500 text-xs flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
