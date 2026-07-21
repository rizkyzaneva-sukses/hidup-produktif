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

function getDaysUntilRenewal(dateStr: string): number {
  const renewal = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const today = todayStr();
  const qc = useQueryClient();
  const [showEod, setShowEod] = useState(false);

  const { data: tasks = [] } = useQuery({ queryKey: ['home-tasks'], queryFn: () => fetcher('/api/tasks') });
  const { data: sprint } = useQuery({ queryKey: ['home-sprint', today], queryFn: () => fetcher(`/api/sprints?date=${today}`) });
  const { data: habitLogs = [] } = useQuery({ queryKey: ['home-habit-logs', today], queryFn: () => fetcher(`/api/habit-logs?date=${today}`) });
  const { data: habits = [] } = useQuery({ queryKey: ['habits-count'], queryFn: () => fetcher('/api/habits') });
  const { data: subs = [] } = useQuery({ queryKey: ['home-subs'], queryFn: () => fetcher('/api/subscriptions') });
  const { data: ideas = [] } = useQuery({ queryKey: ['home-ideas'], queryFn: () => fetcher('/api/ideas') });
  const { data: reminders = [] } = useQuery({ queryKey: ['home-reminders'], queryFn: () => fetcher('/api/reminders') });

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

  const activeTasks = tasks.filter((t: any) => !t.completed).length;
  const habitsDone = habitLogs.length;
  const mentahIdeas = ideas.filter((i: any) => i.status === 'Mentah').length;

  const nearRenewalSubs = (subs as any[])
    .filter((s: any) => s.status === 'Aktif' && s.tanggal_renewal)
    .map((s: any) => ({ ...s, daysLeft: getDaysUntilRenewal(s.tanggal_renewal) }))
    .filter((s: any) => s.daysLeft >= 0 && s.daysLeft <= 7)
    .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  const dayOfWeek = now.getDay().toString();
  const dayOfMonth = today.split('-')[2];
  const todayReminders = (reminders as any[]).filter((r: any) => {
    if (!r.active) return false;
    if (r.frequency === 'Harian') return true;
    if (r.frequency === 'Sekali' && r.date === today) return true;
    if (r.frequency === 'Mingguan' && r.date)
      return new Date(r.date).getDay().toString() === dayOfWeek;
    if (r.frequency === 'Bulanan' && r.date)
      return r.date.split('-')[2] === dayOfMonth;
    return false;
  }).slice(0, 3);

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-slate-500 text-sm">{format(now, 'EEEE, d MMMM yyyy', { locale: id })}</p>
          <h1 className="text-xl font-semibold text-white mt-0.5">{greeting}</h1>
        </div>
        <Link href="/sprint" className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Sprint
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Task Aktif', value: activeTasks, href: '/tasks', color: 'text-blue-400' },
          { label: 'Habit', value: `${habitsDone}/${activeHabits.length}`, href: '/habits', color: 'text-emerald-400' },
          { label: 'Ide Mentah', value: mentahIdeas, href: '/ideas', color: 'text-amber-400' },
          { label: 'Langganan', value: nearRenewalSubs.length > 0 ? `${nearRenewalSubs.length} !` : subs.filter((s: any) => s.status === 'Aktif').length, href: '/subscriptions', color: nearRenewalSubs.length > 0 ? 'text-red-400' : 'text-slate-300' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:border-slate-700 transition-colors">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quote */}
      <div className="py-3 text-center">
        <p className="text-slate-400 text-sm italic leading-relaxed">{quote}</p>
      </div>

      {/* Sholat times */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Sholat Cimahi</p>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
            {Object.entries(SHOLAT_TIMES).map(([name, time]) => {
              const [h, m] = time.split(':').map(Number);
              const isPast = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
              return (
                <div key={name} className="text-center p-1.5 sm:p-2 rounded-lg bg-slate-800/50">
                  <p className={`text-xs font-medium ${isPast ? 'text-slate-600' : 'text-amber-400'}`}>{name}</p>
                  <p className={`text-sm font-mono mt-0.5 ${isPast ? 'text-slate-600' : 'text-white font-semibold'}`}>{time}</p>
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
                <h2 className="font-semibold text-white text-sm">Sprint Hari Ini</h2>
                {sprint.energy_level && <Badge>Energi {sprint.energy_level}/5</Badge>}
              </div>
              {!sprint.eod_submitted_at ? (
                <button onClick={() => setShowEod(true)}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium shrink-0 transition-colors ${
                    isAfter15
                      ? 'bg-amber-500 hover:bg-amber-400 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}>
                  Tutup Hari
                </button>
              ) : <Badge variant="success">EOD Selesai</Badge>}
            </div>
            {sprint.intention && <p className="text-slate-400 text-sm mb-3 italic">"{sprint.intention}"</p>}
            <div className="space-y-1">
              {sprintTasks.map((t: any) => {
                const taskData = tasks.find((tk: any) => tk.id === t.task_id);
                return (
                  <div key={t.task_id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <input type="checkbox" checked={!!taskData?.completed}
                      onChange={e => toggleTask.mutate({ id: t.task_id, completed: e.target.checked })}
                      className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0" />
                    <span className={`text-sm flex-1 min-w-0 truncate ${taskData?.completed ? 'line-through text-slate-500' : 'text-white'}`}>{t.task_title}</span>
                    {t.duration && <span className="text-xs text-slate-500 shrink-0">{t.duration}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-slate-700">
          <CardContent className="py-10 text-center">
            <p className="text-slate-500 text-sm mb-4">Belum ada sprint hari ini</p>
            <Link href="/sprint" className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Mulai Daily Sprint
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Reminders + Subscriptions */}
      {(todayReminders.length > 0 || nearRenewalSubs.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {todayReminders.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Reminder Hari Ini</h3>
                  <Link href="/reminders" className="text-xs text-blue-400 hover:underline">Lihat semua</Link>
                </div>
                <div className="space-y-2">
                  {todayReminders.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="text-sm text-slate-300 flex-1 truncate">{r.title}</span>
                      <span className="text-xs text-slate-500">{r.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {nearRenewalSubs.length > 0 && (
            <Card className="border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Renewal Segera</h3>
                  <Link href="/subscriptions" className="text-xs text-blue-400 hover:underline">Lihat semua</Link>
                </div>
                <div className="space-y-2">
                  {nearRenewalSubs.map((s: any) => {
                    const days = s.daysLeft;
                    const color = days <= 1 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : 'text-amber-400';
                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${color} w-12 shrink-0`}>
                          {days === 0 ? 'HARI INI' : days === 1 ? 'BESOK' : `H-${days}`}
                        </span>
                        <span className="text-sm text-slate-300 flex-1 truncate">{s.nama}</span>
                        <span className="text-xs text-slate-500">Rp {(s.nominal || 0).toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Calendar strip */}
      <div>
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">10 Hari ke Depan</h2>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
          {calDays.map(({ d, dStr, dots }) => (
            <div key={dStr} className={`shrink-0 w-12 sm:w-14 rounded-lg p-1.5 sm:p-2 text-center border transition-colors ${
              dStr === today
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}>
              <p className={`text-xs ${dStr === today ? 'text-blue-400 font-medium' : 'text-slate-500'}`}>
                {format(d, 'EEE', { locale: id })}
              </p>
              <p className={`text-lg font-semibold ${dStr === today ? 'text-white' : 'text-slate-300'}`}>
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
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">Progress per Peran</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {roleProgress.map(({ role, done, total }) => {
            const cfg = ROLE_CONFIG[role];
            return (
              <Link key={role} href={`/role/${role}`}>
                <Card className="hover:border-slate-700 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">{cfg?.emoji}</span>
                      <span className="text-sm font-medium text-white truncate">{role}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1.5">{done}/{total} selesai</p>
                    <ProgressBar value={done} max={total || 1} colorClass={
                      cfg?.color === 'pink' ? 'bg-pink-500' :
                      cfg?.color === 'green' ? 'bg-emerald-500' :
                      cfg?.color === 'purple' ? 'bg-purple-500' :
                      cfg?.color === 'amber' ? 'bg-amber-500' :
                      'bg-blue-500'
                    } />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {showEod && sprint && (
        <EODModal sprint={sprint} liveTasks={tasks} onClose={() => { setShowEod(false); qc.invalidateQueries({ queryKey: ['home-sprint', today] }); }} />
      )}
    </div>
  );
}
