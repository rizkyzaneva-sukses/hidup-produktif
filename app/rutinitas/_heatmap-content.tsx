'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { format, subDays, startOfMonth, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, EmptyState } from '@/components/ui';
import { todayStr } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Habit { id: string; label: string; emoji: string; active: boolean; streak_goal?: number; }
interface HabitLog { id: string; habit_id: string; date: string; }

const DAYS = 30;

export default function HeatmapPage() {
  const today = todayStr();

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['habits'], queryFn: () => fetcher('/api/habits') });
  const { data: allLogs = [] } = useQuery<HabitLog[]>({ queryKey: ['habit-logs'], queryFn: () => fetcher('/api/habit-logs') });

  const activeHabits = useMemo(() => (habits as Habit[]).filter(h => h.active), [habits]);

  // 30-day grid, oldest → today
  const days = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const d = subDays(new Date(), DAYS - 1 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const done = allLogs.filter(l => l.date === dateStr).length;
      return { dateStr, date: d, done };
    });
  }, [allLogs]);

  // Stats
  const todayDone = useMemo(() => allLogs.filter(l => l.date === today).length, [allLogs, today]);

  const longestStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    let best = 0;
    for (const h of activeHabits) {
      let s = 0;
      let check = new Date();
      while (true) {
        const ds = format(check, 'yyyy-MM-dd');
        if (allLogs.some(l => l.habit_id === h.id && l.date === ds)) { s++; check = subDays(check, 1); }
        else break;
      }
      best = Math.max(best, s);
    }
    return best;
  }, [activeHabits, allLogs]);

  const monthlyProgress = useMemo(() => {
    if (activeHabits.length === 0) return { done: 0, possible: 0, pct: 0 };
    const start = startOfMonth(new Date());
    const daysInMonth = eachDayOfInterval({ start, end: new Date() });
    const possible = activeHabits.length * daysInMonth.length;
    const done = allLogs.filter(l => l.date >= format(start, 'yyyy-MM-dd') && l.date <= today).length;
    return { done, possible, pct: possible > 0 ? Math.round((done / possible) * 100) : 0 };
  }, [activeHabits, allLogs, today]);

  // Consistency: full days (all active habits done) in last 30 days
  const fullDays = useMemo(() =>
    days.filter(d => activeHabits.length > 0 && d.done >= activeHabits.length).length
  , [days, activeHabits.length]);

  // Color intensity by completion ratio
  const cellColor = (done: number) => {
    if (activeHabits.length === 0) return 'bg-slate-800/60';
    const ratio = done / activeHabits.length;
    if (done === 0) return 'bg-slate-800/60';
    if (ratio <= 0.25) return 'bg-emerald-900';
    if (ratio <= 0.5) return 'bg-emerald-700';
    if (ratio <= 0.75) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Habit Heatmap</h1>
        <p className="text-slate-500 text-sm">Konsistensi kebiasaan {DAYS} hari terakhir</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-xl font-bold text-emerald-400">{todayDone}/{activeHabits.length}</p>
            <p className="text-xs text-slate-400">Hari Ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-xl font-bold text-amber-400">{longestStreak}d</p>
            <p className="text-xs text-slate-400">Streak Terpanjang</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-xl font-bold text-blue-400">{monthlyProgress.pct}%</p>
            <p className="text-xs text-slate-400">Bulan Ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap grid */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium">🗓 Aktivitas {DAYS} Hari</p>
            <p className="text-xs text-slate-500">{fullDays} hari penuh</p>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {days.map(({ dateStr, date, done }) => (
              <div
                key={dateStr}
                title={`${format(date, 'EEE, d MMM', { locale: id })} — ${done}/${activeHabits.length}`}
                className={`aspect-square rounded-sm ${cellColor(done)} ${
                  dateStr === today ? 'ring-2 ring-blue-400' : ''
                } transition-colors`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {days.slice(-7).map(({ dateStr, date }) => (
                <span key={dateStr} className={`text-[10px] ${dateStr === today ? 'text-blue-400 font-semibold' : 'text-slate-500'}`}>
                  {format(date, 'd/M')}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-500 mr-1">Kurang</span>
              {['bg-slate-800/60', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-400'].map(c => (
                <div key={c} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
              ))}
              <span className="text-[10px] text-slate-500 ml-1">Penuh</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-habit breakdown */}
      <Card>
        <CardContent>
          <p className="text-xs text-slate-400 font-medium mb-3">Konsistensi per Habit ({DAYS} hari)</p>
          {activeHabits.length === 0 && <EmptyState title="Belum ada habit" desc="Tambah habit pertamamu di atas" />}
          <div className="space-y-3">
            {activeHabits.map(h => {
              const doneInWindow = days.filter(d => allLogs.some(l => l.habit_id === h.id && l.date === d.dateStr)).length;
              const pct = Math.round((doneInWindow / DAYS) * 100);
              return (
                <div key={h.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base shrink-0">{h.emoji || '✅'}</span>
                    <span className="text-sm text-white flex-1 min-w-0 truncate">{h.label}</span>
                    {h.streak_goal ? (
                      <span className="text-xs text-slate-500 shrink-0">{doneInWindow}/{DAYS} · target {h.streak_goal}d</span>
                    ) : (
                      <span className="text-xs text-slate-500 shrink-0">{doneInWindow}/{DAYS} · {pct}%</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
