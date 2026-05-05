'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { ROLES } from '@/lib/constants';
import { weekStartStr, todayStr } from '@/lib/utils';
import { Card, CardContent, Button, Textarea, ProgressBar, Badge } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LaporanPage() {
  const [tab, setTab] = useState<'mingguan' | 'tren' | 'riwayat'>('mingguan');
  const [notes, setNotes] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const qc = useQueryClient();
  const weekStart = weekStartStr();
  const today = todayStr();

  const { data: tasks = [] } = useQuery({ queryKey: ['laporan-tasks'], queryFn: () => fetcher('/api/tasks') });
  const { data: ideas = [] } = useQuery({ queryKey: ['laporan-ideas'], queryFn: () => fetcher('/api/ideas') });
  const { data: habitLogs = [] } = useQuery({ queryKey: ['laporan-habits'], queryFn: () => fetcher('/api/habit-logs') });
  const { data: weeklyReview } = useQuery({ queryKey: ['weekly-review', weekStart], queryFn: () => fetcher(`/api/weekly-review?week_start=${weekStart}`) });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints-history'], queryFn: () => fetcher('/api/sprints') });

  const saveReview = useMutation({
    mutationFn: () => fetch('/api/weekly-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ week_start: weekStart, reflection_notes: notes }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly-review', weekStart] }),
  });

  // Load existing notes
  useState(() => { if (weeklyReview?.reflection_notes) setNotes(weeklyReview.reflection_notes); });

  // Week range
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekTasks = tasks.filter((t: any) => {
    const created = t.created_at?.split('T')[0] || '';
    return created >= weekStart && created <= weekEnd;
  });

  // Role stats this week
  const roleStats = ROLES.map(role => {
    const roleTasks = weekTasks.filter((t: any) => t.role === role);
    return { role, done: roleTasks.filter((t: any) => t.completed).length, total: roleTasks.length };
  });

  // Habit days (≥6 habits done)
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
  const habitDays = last7.filter(d => {
    const count = habitLogs.filter((l: any) => l.date === d).length;
    return count >= 6;
  }).length;

  // Unprocessed ideas
  const mentahIdeas = ideas.filter((i: any) => i.status === 'Mentah').slice(0, 5);

  // Sprint history for selected month
  const monthSprints = sprints.filter((s: any) => s.date?.startsWith(month)).sort((a: any, b: any) => b.date.localeCompare(a.date));

  const TABS = [
    { key: 'mingguan', label: '📋 Mingguan' },
    { key: 'tren', label: '📊 Tren' },
    { key: 'riwayat', label: '📅 Riwayat Sprint' },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white">📊 Laporan & Review</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mingguan */}
      {tab === 'mingguan' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Minggu {format(new Date(weekStart), 'd MMM', { locale: id })} — {format(new Date(weekEnd), 'd MMM yyyy', { locale: id })}</p>

          {/* Task by role */}
          <Card>
            <CardContent>
              <h2 className="font-medium text-white mb-3">✅ Task per Peran</h2>
              <div className="space-y-3">
                {roleStats.map(({ role, done, total }) => (
                  <div key={role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{role}</span>
                      <span className="text-slate-500">{done}/{total}</span>
                    </div>
                    <ProgressBar value={done} max={total || 1} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Habit summary */}
          <Card>
            <CardContent>
              <h2 className="font-medium text-white mb-2">🌟 Habit Summary</h2>
              <p className="text-slate-400 text-sm">{habitDays}/7 hari dengan ≥6 habit selesai</p>
              <ProgressBar value={habitDays} max={7} colorClass="bg-green-500" className="mt-2" />
            </CardContent>
          </Card>

          {/* Unprocessed ideas */}
          {mentahIdeas.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="font-medium text-white mb-2">💡 Ide Belum Diproses ({ideas.filter((i: any) => i.status === 'Mentah').length})</h2>
                <div className="space-y-1">
                  {mentahIdeas.map((i: any) => (
                    <p key={i.id} className="text-sm text-slate-400">• {i.title}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reflection */}
          <Card>
            <CardContent>
              <h2 className="font-medium text-white mb-3">✍️ Refleksi Mingguan</h2>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Apa yang berjalan baik minggu ini? Apa yang bisa diperbaiki?" />
              <Button onClick={() => saveReview.mutate()} className="w-full mt-3">
                {saveReview.isPending ? 'Menyimpan...' : 'Simpan Refleksi'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tren */}
      {tab === 'tren' && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <h2 className="font-medium text-white mb-3">📊 Task per Peran (Semua Waktu)</h2>
              <div className="space-y-3">
                {ROLES.map(role => {
                  const rt = tasks.filter((t: any) => t.role === role);
                  const done = rt.filter((t: any) => t.completed).length;
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{role}</span>
                        <span className="text-slate-500">{done} selesai / {rt.length} total</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div className="bg-blue-500 rounded-l" style={{ width: `${rt.length > 0 ? (done / rt.length) * 100 : 0}%` }} />
                        <div className="bg-slate-700 rounded-r flex-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="font-medium text-white mb-3">📈 Ringkasan Umum</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Task', value: tasks.length },
                  { label: 'Selesai', value: tasks.filter((t: any) => t.completed).length },
                  { label: 'Total Ide', value: ideas.length },
                  { label: 'Ide Dieksekusi', value: ideas.filter((i: any) => i.status === 'Dieksekusi').length },
                ].map(s => (
                  <div key={s.label} className="bg-slate-700/40 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Riwayat Sprint */}
      {tab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMonth(m => { const d = new Date(m + '-01'); d.setMonth(d.getMonth() - 1); return format(d, 'yyyy-MM'); })}>←</Button>
            <span className="flex-1 text-center text-white font-medium">{format(new Date(month + '-01'), 'MMMM yyyy', { locale: id })}</span>
            <Button variant="outline" size="sm" onClick={() => setMonth(m => { const d = new Date(m + '-01'); d.setMonth(d.getMonth() + 1); return format(d, 'yyyy-MM'); })}>→</Button>
          </div>

          {monthSprints.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Tidak ada sprint bulan ini</p>
          ) : (
            <div className="space-y-2">
              {monthSprints.map((s: any) => {
                const tasks: any[] = s.tasks || [];
                const eod: any[] = s.eod_task_statuses || [];
                const done = eod.filter((t: any) => t.status === 'Selesai').length;
                return (
                  <Card key={s.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{format(new Date(s.date), 'EEE, d MMM', { locale: id })}</span>
                            {s.energy_level && <Badge>⚡ {s.energy_level}/5</Badge>}
                            {s.eod_submitted_at && <Badge variant="success">EOD ✅</Badge>}
                          </div>
                          {tasks.length > 0 && <p className="text-xs text-slate-500 mt-0.5">{done}/{tasks.length} task selesai</p>}
                        </div>
                      </div>
                      {s.intention && <p className="text-xs text-slate-400 mt-1 italic">"{s.intention}"</p>}
                      {eod.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {eod.map((t: any) => (
                            <div key={t.task_id} className="flex items-center gap-2 text-xs">
                              <span>{t.status === 'Selesai' ? '✅' : t.status.includes('Sebagian') ? '🔄' : '❌'}</span>
                              <span className="text-slate-400">{t.task_title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.eod_notes && <p className="text-xs text-slate-500 mt-1.5 bg-slate-700/40 rounded px-2 py-1">{s.eod_notes}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
