'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { eachDayOfInterval, startOfMonth, subDays, format } from 'date-fns';
import { todayStr } from '@/lib/utils';
import { Card, CardContent, Button, Input, Dialog, EmptyState, Toggle } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const EMOJIS = ['🕌','💪','📖','💌','💧','🛏️','🍎','🧘','✍️','🏃','🎯','📝','🌿','☀️','🎓','💊','🥗','😊','🤲','🔥'];

export default function HabitsPage() {
  const today = todayStr();
  const qc = useQueryClient();
  const [manageMode, setManageMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('✅');

  const { data: habits = [] } = useQuery({ queryKey: ['habits'], queryFn: () => fetcher('/api/habits') });
  const { data: allLogs = [] } = useQuery({ queryKey: ['habit-logs'], queryFn: () => fetcher('/api/habit-logs') });

  // Seed habits
  useEffect(() => {
    if (habits.length === 0) {
      fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: true }) })
        .then(() => qc.invalidateQueries({ queryKey: ['habits'] }));
    }
  }, [habits.length]);

  const todayLogs = allLogs.filter((l: any) => l.date === today);
  const [streakGoalInputs, setStreakGoalInputs] = useState<Record<string, string>>({});

  const toggleHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const existing = todayLogs.find((l: any) => l.habit_id === habitId);
      if (existing) {
        return fetch(`/api/habit-logs/${existing.id}`, { method: 'DELETE' });
      }
      return fetch('/api/habit-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ habit_id: habitId, date: today }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit-logs'] }),
  });

  const updateHabit = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/habits/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) => fetch(`/api/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const addHabit = useMutation({
    mutationFn: () => fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: newLabel, emoji: newEmoji }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); setNewLabel(''); setShowAdd(false); },
  });

  const getStreak = (habitId: string) => {
    let streak = 0;
    let check = new Date();
    while (true) {
      const d = format(check, 'yyyy-MM-dd');
      if (allLogs.some((l: any) => l.habit_id === habitId && l.date === d)) {
        streak++;
        check = subDays(check, 1);
      } else break;
    }
    return streak;
  };

  const getLast7Days = (habitId: string) => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const done = allLogs.some((l: any) => l.habit_id === habitId && l.date === d);
      return { d, done };
    });
  };

  const getMonthlyProgress = (habitId: string) => {
    const days = eachDayOfInterval({ start: startOfMonth(new Date()), end: new Date() });
    const done = days.filter(d => allLogs.some((l: any) => l.habit_id === habitId && l.date === format(d, 'yyyy-MM-dd'))).length;
    return { done, total: days.length };
  };

  const activeHabits = habits.filter((h: any) => h.active);
  const totalStreak = activeHabits.reduce((max: number, h: any) => Math.max(max, getStreak(h.id)), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white">🌟 Daily Habits</h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {todayLogs.length}/{activeHabits.length} hari ini
            {totalStreak > 0 && <span className="ml-2 text-amber-400">🔥 streak terpanjang {totalStreak} hari</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setManageMode(!manageMode)} className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors ${manageMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {manageMode ? 'Selesai' : '⚙️ Kelola'}
          </button>
          {manageMode && <Button size="sm" onClick={() => setShowAdd(true)}>+ Habit</Button>}
        </div>
      </div>

      {/* Track today */}
      {!manageMode && (
        <div className="space-y-2 sm:space-y-3">
          {activeHabits.length === 0 && <EmptyState icon="🌟" title="Belum ada habit" desc="Tambah habit pertamamu" />}
          {activeHabits.map((h: any) => {
            const isDone = todayLogs.some((l: any) => l.habit_id === h.id);
            const streak = getStreak(h.id);
            const { done, total } = getMonthlyProgress(h.id);
            return (
              <div key={h.id} onClick={() => toggleHabit.mutate(h.id)}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                  isDone 
                    ? 'border-green-500/40 bg-green-500/10 shadow-sm shadow-green-500/10' 
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                }`}>
                <span className="text-xl sm:text-2xl flex-shrink-0">{h.emoji || '✅'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-xs sm:text-sm ${isDone ? 'text-green-300' : 'text-white'}`}>{h.label}</p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">{done}/{total}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-base sm:text-lg">{isDone ? '✅' : '○'}</p>
                  {/* 7-day dots with goal line */}
                  <div className="flex gap-0.5">
                    {getLast7Days(h.id).map(({ d, done: dayDone }, idx) => {
                      const streakGoal = h.streak_goal || 0;
                      const isGoalDay = streakGoal > 0 && idx === streakGoal - 1;
                      return (
                        <span key={d} title={d}
                          className={`w-2 h-2 rounded-full ${
                            dayDone ? 'bg-green-400' : isGoalDay ? 'ring-1 ring-amber-400 bg-slate-700' : 'bg-slate-700'
                          }`} />
                      );
                    })}
                  </div>
                  {streak > 0 && <p className="text-[10px] text-amber-400">🔥 {streak}d</p>}
                  {h.streak_goal > 0 && (
                    <p className={`text-[10px] ${streak >= h.streak_goal ? 'text-yellow-300 font-bold' : 'text-slate-500'}`}>
                      {streak >= h.streak_goal ? '🎉' : ''} {streak}/{h.streak_goal}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage mode */}
      {manageMode && (
        <div className="space-y-2">
          {habits.map((h: any) => (
            <div key={h.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-slate-700/50 bg-slate-800/40">
              <span className="text-lg sm:text-xl">{h.emoji}</span>
              <span className="flex-1 text-xs sm:text-sm text-white min-w-0 truncate">{h.label}</span>
              {h.pinned && <span className="text-[10px] sm:text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">📌</span>}
              {/* Streak goal input */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-500 hidden sm:inline">🎯</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Goal"
                  value={streakGoalInputs[h.id] ?? (h.streak_goal || '')}
                  onChange={e => setStreakGoalInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                  onBlur={() => {
                    const val = Number(streakGoalInputs[h.id] ?? h.streak_goal) || 0;
                    if (val !== (h.streak_goal || 0)) {
                      updateHabit.mutate({ id: h.id, streak_goal: val });
                    }
                  }}
                  className="w-12 sm:w-14 h-7 px-1.5 rounded-lg bg-slate-700 border border-slate-600 text-white text-[10px] sm:text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
              <Toggle checked={h.active} onChange={v => updateHabit.mutate({ id: h.id, active: v })} />
              {!h.pinned && (
                <Button size="icon" variant="ghost" onClick={() => deleteHabit.mutate(h.id)} className="h-8 w-8 text-red-400">🗑</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="➕ Tambah Habit">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input className="w-14 text-center text-xl p-1" value={newEmoji} onChange={e => setNewEmoji(e.target.value)} maxLength={2} />
            <Input placeholder="Nama habit" value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit.mutate()} />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setNewEmoji(e)} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-lg sm:text-xl hover:bg-slate-700 transition-colors ${newEmoji === e ? 'bg-slate-600 ring-2 ring-blue-500' : ''}`}>{e}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addHabit.mutate()} disabled={!newLabel.trim()} className="flex-1">Tambah</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
