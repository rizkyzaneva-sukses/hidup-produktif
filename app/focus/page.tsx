'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const MODES = [
  { label: 'Pomodoro', duration: 25 * 60, color: 'text-red-400', bg: 'bg-red-500/20', ring: 'border-red-500/50' },
  { label: 'Short Break', duration: 5 * 60, color: 'text-green-400', bg: 'bg-green-500/20', ring: 'border-green-500/50' },
  { label: 'Long Break', duration: 15 * 60, color: 'text-blue-400', bg: 'bg-blue-500/20', ring: 'border-blue-500/50' },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusPage() {
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [logs, setLogs] = useState<{ task: string; time: string; mode: string }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-focus'],
    queryFn: () => fetcher('/api/tasks?completed=false'),
  });

  const mode = MODES[modeIdx];

  useEffect(() => {
    setTimeLeft(mode.duration);
    setRunning(false);
  }, [modeIdx]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            playDing();
            if (modeIdx === 0) {
              setCompletedPomodoros(c => c + 1);
              const task = tasks.find((t: any) => t.id === selectedTaskId);
              setLogs(prev => [{ task: task?.title || '—', time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), mode: 'Pomodoro' }, ...prev.slice(0, 9)]);
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
  }, [running]);

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

  const reset = () => { setRunning(false); setTimeLeft(mode.duration); };
  const pct = ((mode.duration - timeLeft) / mode.duration) * 100;
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">⏱ Focus Mode</h1>
      <p className="text-slate-400 text-sm mb-5">Teknik Pomodoro untuk kerja fokus</p>

      {/* Mode selector */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl mb-6">
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
              <div className="flex gap-1 mt-2">
                {Array.from({ length: completedPomodoros % 4 || completedPomodoros }).map((_, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-red-400" />
                ))}
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
          className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="">— Pilih task —</option>
          {tasks.map((t: any) => (
            <option key={t.id} value={t.id}>[{t.role}] {t.title}</option>
          ))}
        </select>
      </div>

      {/* Pomodoro count */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-5">
        <span className="text-sm text-slate-400">Pomodoro selesai hari ini</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{completedPomodoros}</span>
          <span className="text-xs text-slate-500">sesi</span>
        </div>
      </div>

      {/* Session log */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">📝 Log Sesi</h2>
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
