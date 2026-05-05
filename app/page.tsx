'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import Link from 'next/link';
import { QUOTES, SHOLAT_TIMES, ROLE_CONFIG, ROLES } from '@/lib/constants';
import { todayStr, getGreeting, getDailyQuote } from '@/lib/utils';
import { Card, CardContent, ProgressBar, Badge } from '@/components/ui';
import { EODModal } from '@/components/sprint/EODModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function HomePage() {
  const today = todayStr();
  const qc = useQueryClient();
  const [showEod, setShowEod] = useState(false);

  const { data: tasks = [] } = useQuery({ queryKey: ['home-tasks'], queryFn: () => fetcher('/api/tasks') });
  const { data: sprint } = useQuery({ queryKey: ['home-sprint', today], queryFn: () => fetcher(`/api/sprints?date=${today}`) });
  const { data: habitLogs = [] } = useQuery({ queryKey: ['home-habit-logs', today], queryFn: () => fetcher(`/api/habit-logs?date=${today}`) });
  const { data: habits = [] } = useQuery({ queryKey: ['habits-count'], queryFn: () => fetcher('/api/habits') });

  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home-tasks'] }),
  });

  const quote = getDailyQuote(QUOTES);
  const now = new Date();
  const greeting = getGreeting();
  const isAfter15 = now.getHours() >= 15;
  const activeHabits = habits.filter((h: any) => h.active);
  const sprintTasks: any[] = sprint?.tasks || [];

  const roleProgress = ROLES.map(role => {
    const roleTasks = tasks.filter((t: any) => t.role === role);
    return { role, done: roleTasks.filter((t: any) => t.completed).length, total: roleTasks.length };
  });

  const calDays = Array.from({ length: 10 }, (_, i) => {
    const d = addDays(now, i);
    const dStr = format(d, 'yyyy-MM-dd');
    const dots = tasks.filter((t: any) => !t.completed && t.due_date === dStr).slice(0, 3);
    return { d, dStr, dots };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-slate-400 text-xs sm:text-sm">{format(now, 'EEEE, d MMMM yyyy', { locale: id })}</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 truncate">{greeting} 👋</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {habitLogs.length}/{activeHabits.length} habit hari ini ·{' '}
            <Link href="/habits" className="text-blue-400 hover:underline">lihat habit</Link>
          </p>
        </div>
        <Link href="/sprint" className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-600/20">
          🎯 Sprint
        </Link>
      </div>

      {/* Quote */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <p className="text-slate-300 text-xs sm:text-sm italic text-center leading-relaxed">✨ {quote}</p>
        </CardContent>
      </Card>

      {/* Sholat times - responsive grid instead of flex */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">🕌 Sholat Cimahi</p>
          <div className="grid grid-cols-5 gap-1 sm:gap-3">
            {Object.entries(SHOLAT_TIMES).map(([name, time]) => {
              const [h, m] = time.split(':').map(Number);
              const isPast = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
              return (
                <div key={name} className="text-center p-1.5 sm:p-2 rounded-lg bg-slate-800/50">
                  <p className={`text-[10px] sm:text-xs font-medium ${isPast ? 'text-slate-500' : 'text-amber-400'}`}>{name}</p>
                  <p className={`text-xs sm:text-sm font-mono mt-0.5 ${isPast ? 'text-slate-600' : 'text-white font-semibold'}`}>{time}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sprint widget */}
      {sprint && sprintTasks.length > 0 ? (
        <Card className="border-blue-500/20">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🎯</span>
                <h2 className="font-semibold text-white text-sm sm:text-base truncate">Sprint Hari Ini</h2>
                {sprint.energy_level && <Badge className="hidden sm:inline-flex">⚡ {sprint.energy_level}/5</Badge>}
              </div>
              {!sprint.eod_submitted_at ? (
                <button onClick={() => setShowEod(true)}
                  className={`text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors ${isAfter15 ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
                  Tutup Hari
                </button>
              ) : <Badge variant="success">✅ EOD</Badge>}
            </div>
            {sprint.intention && <p className="text-slate-400 text-xs sm:text-sm mb-3 italic">"{sprint.intention}"</p>}
            <div className="space-y-1.5 sm:space-y-2">
              {sprintTasks.map((t: any) => {
                const taskData = tasks.find((tk: any) => tk.id === t.task_id);
                return (
                  <div key={t.task_id} className="flex items-center gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <input type="checkbox" checked={!!taskData?.completed}
                      onChange={e => toggleTask.mutate({ id: t.task_id, completed: e.target.checked })}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500 cursor-pointer flex-shrink-0" />
                    <span className={`text-xs sm:text-sm flex-1 min-w-0 truncate ${taskData?.completed ? 'line-through text-slate-500' : 'text-white'}`}>{t.task_title}</span>
                    {t.duration && <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">{t.duration}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-blue-500/30">
          <CardContent className="py-8 sm:py-10 text-center">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-slate-400 text-sm mb-4">Belum ada sprint hari ini</p>
            <Link href="/sprint" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20">
              Mulai Daily Sprint →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Calendar strip */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2 sm:mb-3">📅 10 Hari ke Depan</h2>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
          {calDays.map(({ d, dStr, dots }) => (
            <div key={dStr} className={`flex-shrink-0 w-12 sm:w-14 rounded-xl p-1.5 sm:p-2 text-center border transition-all ${
              dStr === today 
                ? 'bg-blue-600/20 border-blue-500/50 shadow-sm shadow-blue-500/20' 
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
            }`}>
              <p className={`text-[10px] sm:text-xs ${dStr === today ? 'text-blue-300 font-medium' : 'text-slate-500'}`}>
                {format(d, 'EEE', { locale: id })}
              </p>
              <p className={`text-base sm:text-lg font-bold ${dStr === today ? 'text-white' : 'text-slate-300'}`}>
                {format(d, 'd')}
              </p>
              <div className="flex justify-center gap-0.5 mt-1 h-1.5">
                {dots.map((_: any, i: number) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role progress */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2 sm:mb-3">👑 Progress per Peran</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {roleProgress.map(({ role, done, total }) => {
            const cfg = ROLE_CONFIG[role];
            return (
              <Link key={role} href={`/role/${role}`}>
                <Card className="hover:border-slate-600 cursor-pointer transition-all hover:shadow-md hover:shadow-slate-900/50 active:scale-[0.98]">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base sm:text-lg">{cfg?.emoji}</span>
                      <span className="text-xs sm:text-sm font-medium text-white truncate">{role}</span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1.5">{done}/{total} selesai</p>
                    <ProgressBar value={done} max={total || 1} colorClass={`bg-${cfg?.color || 'blue'}-500`} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {showEod && sprint && (
        <EODModal sprint={sprint} onClose={() => { setShowEod(false); qc.invalidateQueries({ queryKey: ['home-sprint', today] }); }} />
      )}
    </div>
  );
}
