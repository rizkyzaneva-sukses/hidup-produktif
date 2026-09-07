'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { MOODS } from '@/lib/constants';
import { Card, CardContent, EmptyState, Button } from '@/components/ui';
import { todayStr } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface MoodEntry { id: string; date: string; hour: number; energy: number; mood: string; notes: string; }

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00 - 23:00
const ENERGY_COLORS: Record<number, string> = {
  1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500', 5: 'bg-emerald-500',
};
const ENERGY_COLORS_LIGHT: Record<number, string> = {
  1: 'bg-red-500/20 border-red-500/40', 2: 'bg-orange-500/20 border-orange-500/40',
  3: 'bg-yellow-500/20 border-yellow-500/40', 4: 'bg-green-500/20 border-green-500/40',
  5: 'bg-emerald-500/20 border-emerald-500/40',
};
const MOOD_EMOJIS: Record<string, string> = {
  'Sangat Baik': '😄', 'Baik': '🙂', 'Netral': '😐', 'Kurang Baik': '😕', 'Buruk': '😞',
};

function hourLabel(h: number) { return `${String(h).padStart(2, '0')}:00`; }

export default function MoodPage() {
  const qc = useQueryClient();
  const today = todayStr();
  const [selectedEntry, setSelectedEntry] = useState<{ date: string; hour: number } | null>(null);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState('Netral');
  const [notes, setNotes] = useState('');

  // Fetch mood entries for the past 7 days
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: allEntries = [] } = useQuery({
    queryKey: ['mood-entries', weekStart],
    queryFn: () => fetcher(`/api/mood-entries?from=${weekStart}`),
  });

  const todayEntries: MoodEntry[] = useMemo(() =>
    allEntries.filter((e: MoodEntry) => e.date === today), [allEntries, today]);

  // Weekly heatmap data (7 days)
  const heatmapDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLabel = format(d, 'EEE d', { locale: id });
      const entries: MoodEntry[] = allEntries.filter((e: MoodEntry) => e.date === dateStr);
      return { dateStr, dayLabel, entries };
    });
  }, [allEntries]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return fetch(`/api/mood-entries/${data.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ energy: data.energy, mood: data.mood, notes: data.notes }),
        });
      }
      return fetch('/api/mood-entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: data.date, hour: data.hour, energy: data.energy, mood: data.mood, notes: data.notes }),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mood-entries'] }); setSelectedEntry(null); },
  });

  const clickHour = (date: string, hour: number) => {
    const existing = allEntries.find((e: MoodEntry) => e.date === date && e.hour === hour);
    setSelectedEntry({ date, hour });
    setEnergy(existing?.energy || 3);
    setMood(existing?.mood || 'Netral');
    setNotes(existing?.notes || '');
  };

  const handleSave = () => {
    if (!selectedEntry) return;
    const existing = allEntries.find((e: MoodEntry) => e.date === selectedEntry.date && e.hour === selectedEntry.hour);
    saveMutation.mutate({
      id: existing?.id, date: selectedEntry.date, hour: selectedEntry.hour,
      energy, mood, notes,
    });
  };

  // Stats
  const avgEnergy = useMemo(() => {
    if (todayEntries.length === 0) return 0;
    return todayEntries.reduce((sum: number, e: MoodEntry) => sum + e.energy, 0) / todayEntries.length;
  }, [todayEntries]);

  const mostProductiveHour = useMemo(() => {
    const hourAvg: Record<number, number[]> = {};
    todayEntries.forEach((e: MoodEntry) => {
      if (!hourAvg[e.hour]) hourAvg[e.hour] = [];
      hourAvg[e.hour].push(e.energy);
    });
    let best = 0, bestAvg = 0;
    for (const [h, vals] of Object.entries(hourAvg)) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      if (avg > bestAvg) { bestAvg = avg; best = Number(h); }
    }
    return best;
  }, [todayEntries]);

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEntries.forEach((e: MoodEntry) => { counts[e.mood] = (counts[e.mood] || 0) + 1; });
    return counts;
  }, [allEntries]);

  const dominantMood = useMemo(() => {
    let best = '', bestCount = 0;
    for (const [m, c] of Object.entries(moodCounts)) {
      if (c > bestCount) { bestCount = c; best = m; }
    }
    return best;
  }, [moodCounts]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-lg sm:text-lg font-semibold text-white">Mood & Energy</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Lacak energi dan mood harianmu</p>
      </div>

      {/* Stats */}
      {todayEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-xl font-bold text-white">{avgEnergy.toFixed(1)}</p>
              <p className="text-xs sm:text-xs text-slate-400">Rata-rata Energi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-xl font-bold text-white">{mostProductiveHour > 0 ? hourLabel(mostProductiveHour) : '—'}</p>
              <p className="text-xs sm:text-xs text-slate-400">Jam Produktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-3">
              <p className="text-xl">{dominantMood ? MOOD_EMOJIS[dominantMood] : '—'}</p>
              <p className="text-xs sm:text-xs text-slate-400">Mood Dominan</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today hourly grid */}
      <Card>
        <CardContent>
          <p className="text-xs text-slate-400 font-medium mb-3">📅 Hari Ini — Klik jam untuk log</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-1.5 sm:gap-2">
            {HOURS.map(h => {
              const entry = todayEntries.find((e: MoodEntry) => e.hour === h);
              return (
                <button key={h} onClick={() => clickHour(today, h)}
                  className={`relative flex flex-col items-center p-1.5 sm:p-2 rounded-lg border transition-all active:scale-95 ${
                    entry
                      ? `${ENERGY_COLORS_LIGHT[entry.energy]}`
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                  }`}>
                  <span className="text-xs text-slate-400 font-mono">{hourLabel(h)}</span>
                  {entry ? (
                    <>
                      <span className="text-base sm:text-lg my-0.5">{MOOD_EMOJIS[entry.mood] || '😐'}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full text-white font-medium ${ENERGY_COLORS[entry.energy]}`}>
                        E{entry.energy}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 text-lg my-0.5">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly heatmap */}
      <Card>
        <CardContent>
          <p className="text-xs text-slate-400 font-medium mb-3">🗓 Heatmap Mingguan (Energi)</p>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex items-center gap-0.5 mb-1">
                <span className="w-10 text-xs text-slate-500" />
                {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                  <span key={h} className="text-xs text-slate-500 w-8 text-center">{hourLabel(h)}</span>
                ))}
              </div>
              {/* Day rows */}
              {heatmapDays.map(({ dateStr, dayLabel, entries }) => (
                <div key={dateStr} className="flex items-center gap-0.5 mb-0.5">
                  <span className="w-10 text-xs text-slate-400 truncate">{dayLabel}</span>
                  {HOURS.map(h => {
                    const entry = entries.find((e: MoodEntry) => e.hour === h);
                    return (
                      <div key={h} title={`${dayLabel} ${hourLabel(h)}${entry ? ` - E${entry.energy} ${entry.mood}` : ''}`}
                        onClick={() => dateStr === today ? clickHour(dateStr, h) : undefined}
                        className={`w-8 h-6 rounded-sm transition-colors ${
                          entry ? ENERGY_COLORS[entry.energy] : 'bg-slate-800/60'
                        } ${dateStr === today ? 'cursor-pointer hover:ring-1 hover:ring-blue-400' : ''}`} />
                    );
                  })}
                </div>
              ))}
              {/* Energy legend */}
              <div className="flex items-center gap-2 mt-2 justify-end">
                {[1, 2, 3, 4, 5].map(e => (
                  <div key={e} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${ENERGY_COLORS[e]}`} />
                    <span className="text-xs text-slate-500">E{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood trends */}
      {Object.keys(moodCounts).length > 0 && (
        <Card>
          <CardContent>
            <p className="text-xs text-slate-400 font-medium mb-3">Tren Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <div key={m} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                  moodCounts[m] ? 'border-slate-600 bg-slate-800/60' : 'border-slate-700/30 bg-slate-800/20'
                }`}>
                  <span>{MOOD_EMOJIS[m]}</span>
                  <span className="text-xs text-slate-300">{m}</span>
                  <span className="text-xs text-slate-500">({moodCounts[m] || 0})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {allEntries.length === 0 && (
        <EmptyState  title="Belum ada data mood" desc="Klik jam pada grid di atas untuk mulai mencatat" />
      )}

      {/* Log dialog */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEntry(null)} />
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-t-xl sm:rounded-lg p-4">
            <h2 className="text-sm font-semibold text-white mb-1">
              Log Jam {hourLabel(selectedEntry.hour)}
            </h2>
            <p className="text-xs text-slate-500 mb-3">{format(new Date(selectedEntry.date), 'EEEE, d MMMM yyyy', { locale: id })}</p>

            <div className="space-y-4">
              {/* Energy slider */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">⚡ Energi ({energy})</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(e => (
                    <button key={e} onClick={() => setEnergy(e)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        energy === e ? `${ENERGY_COLORS[e]} text-white scale-105` : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood selector */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setMood(m)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        mood === m ? 'bg-blue-600/30 border border-blue-500/50 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}>
                      <span>{MOOD_EMOJIS[m]}</span>
                      <span className="hidden sm:inline">{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Catatan</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Apa yang kamu lakukan?"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">Simpan</Button>
                <Button variant="outline" onClick={() => setSelectedEntry(null)}>Batal</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
