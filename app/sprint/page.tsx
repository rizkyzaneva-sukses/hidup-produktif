'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { DURATION_OPTIONS, DURATION_HOURS, WORK_TYPES, ROLES } from '@/lib/constants';
import { todayStr, yesterdayStr } from '@/lib/utils';
import { Card, CardContent, Button, Select, Badge, EmptyState } from '@/components/ui';
import { WorkTypeBadge, RoleBadge } from '@/components/shared/badges';
import { EODModal } from '@/components/sprint/EODModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SprintPage() {
  const today = todayStr();
  const yesterday = yesterdayStr();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState(3);
  const [intention, setIntention] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Array<{ task_id: string; task_title: string; duration: string }>>([
    { task_id: '', task_title: '', duration: '1 jam' },
    { task_id: '', task_title: '', duration: '1 jam' },
    { task_id: '', task_title: '', duration: '1 jam' },
  ]);
  const [showEod, setShowEod] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: todaySprint } = useQuery({ queryKey: ['sprint', today], queryFn: () => fetcher(`/api/sprints?date=${today}`) });
  const { data: yesterdaySprint } = useQuery({ queryKey: ['sprint', yesterday], queryFn: () => fetcher(`/api/sprints?date=${yesterday}`) });
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks-sprint'], queryFn: () => fetcher('/api/tasks?completed=false') });

  // Carryover logic
  const carryoverIds = (yesterdaySprint?.eod_task_statuses || [])
    .filter((s: any) => s.status === 'Sebagian — lanjut besok' || s.status === 'Tidak dikerjakan')
    .map((s: any) => s.task_id);

  const sortedTasks = [...allTasks].sort((a: any, b: any) => {
    const aCarry = carryoverIds.includes(a.id) ? 0 : 1;
    const bCarry = carryoverIds.includes(b.id) ? 0 : 1;
    if (aCarry !== bCarry) return aCarry - bCarry;
    if (a.work_type === 'Deep Work' && b.work_type !== 'Deep Work') return -1;
    if (b.work_type === 'Deep Work' && a.work_type !== 'Deep Work') return 1;
    const pri: Record<string, number> = { Tinggi: 0, Sedang: 1, Rendah: 2 };
    return (pri[a.priority] || 1) - (pri[b.priority] || 1);
  });

  // Auto-fill suggestions on first load
  useEffect(() => {
    if (!todaySprint && sortedTasks.length > 0 && selectedTasks.every(t => !t.task_id)) {
      const suggestions = sortedTasks.slice(0, 3);
      setSelectedTasks(suggestions.map((t: any) => ({ task_id: t.id, task_title: t.title, duration: '1 jam' })));
    }
  }, [todaySprint, sortedTasks.length]);

  const saveSprint = useMutation({
    mutationFn: async () => {
      const tasks = selectedTasks.filter(t => t.task_id);
      if (todaySprint?.id) {
        return fetch(`/api/sprints/${todaySprint.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ energy_level: energy, intention, tasks }),
        });
      }
      return fetch('/api/sprints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, energy_level: energy, intention, tasks }),
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sprint', today] }); setEditing(false); },
  });

  const toggleTaskDone = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks-sprint'] }),
  });

  const totalHours = selectedTasks.reduce((sum, t) => sum + (DURATION_HOURS[t.duration] || 0), 0);
  const sprintExists = !!todaySprint?.tasks?.length && !editing;

  // Summary view
  if (sprintExists) {
    const sprintTasks: any[] = todaySprint.tasks || [];
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white">🎯 Sprint Hari Ini</h1>
            <p className="text-slate-400 text-xs sm:text-sm">{format(new Date(), 'EEEE, d MMMM', { locale: id })}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!todaySprint.eod_submitted_at && (
              <Button onClick={() => setShowEod(true)} variant={new Date().getHours() >= 15 ? 'default' : 'secondary'} size="sm">
                🌙 Tutup
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-2 sm:gap-3 flex-wrap mb-3">
              {todaySprint.energy_level && <Badge>⚡ Energi {todaySprint.energy_level}/5</Badge>}
              {todaySprint.eod_submitted_at && <Badge variant="success">✅ EOD Selesai</Badge>}
            </div>
            {todaySprint.intention && <p className="text-slate-300 text-xs sm:text-sm italic mb-4">"{todaySprint.intention}"</p>}
            <div className="space-y-2 sm:space-y-3">
              {sprintTasks.map((t: any) => {
                const taskData = allTasks.find((tk: any) => tk.id === t.task_id);
                const isCarry = carryoverIds.includes(t.task_id);
                return (
                  <div key={t.task_id} className="flex items-center gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors">
                    <input type="checkbox" checked={!!taskData?.completed}
                      onChange={e => toggleTaskDone.mutate({ id: t.task_id, completed: e.target.checked })}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500 cursor-pointer flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${taskData?.completed ? 'line-through text-slate-500' : 'text-white'}`}>{t.task_title}</p>
                      <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        {isCarry && <span className="text-[10px] sm:text-xs text-amber-400">🔄 carryover</span>}
                        {taskData && <WorkTypeBadge type={taskData.work_type} />}
                        {taskData && <RoleBadge role={taskData.role} />}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">{t.duration}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Yesterday recap */}
        {yesterdaySprint?.eod_task_statuses?.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-3">📋 Recap Kemarin</h3>
              <div className="space-y-2">
                {yesterdaySprint.eod_task_statuses.map((s: any) => (
                  <div key={s.task_id} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span>{s.status === 'Selesai' ? '✅' : s.status.includes('Sebagian') ? '🔄' : '❌'}</span>
                    <span className="text-slate-300 flex-1 min-w-0 truncate">{s.task_title}</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 flex-shrink-0">{s.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showEod && todaySprint && (
          <EODModal sprint={todaySprint} onClose={() => { setShowEod(false); qc.invalidateQueries({ queryKey: ['sprint', today] }); }} />
        )}
      </div>
    );
  }

  // Form view - 2 panel (stacked on mobile)
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-white">🎯 Daily Sprint</h1>
        <p className="text-slate-400 text-xs sm:text-sm">{format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left panel - Recap kemarin */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h2 className="font-semibold text-white text-sm sm:text-base mb-3">📋 Recap Kemarin</h2>
            {yesterdaySprint?.eod_task_statuses?.length > 0 ? (
              <div className="space-y-2">
                {yesterdaySprint.eod_task_statuses.map((s: any) => (
                  <div key={s.task_id} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="mt-0.5">{s.status === 'Selesai' ? '✅' : s.status.includes('Sebagian') ? '🔄' : '❌'}</span>
                    <div className="min-w-0">
                      <p className="text-slate-300 truncate">{s.task_title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{s.status}</p>
                    </div>
                  </div>
                ))}
                {yesterdaySprint.eod_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-[10px] sm:text-xs text-slate-500">Catatan: {yesterdaySprint.eod_notes}</p>
                  </div>
                )}
              </div>
            ) : yesterdaySprint && !yesterdaySprint.eod_submitted_at ? (
              <div>
                <p className="text-slate-400 text-xs sm:text-sm mb-3">EOD kemarin belum diisi.</p>
                <Button size="sm" onClick={() => setShowEod(true)} variant="outline">Isi EOD Kemarin</Button>
              </div>
            ) : (
              <p className="text-slate-500 text-xs sm:text-sm">Tidak ada sprint kemarin.</p>
            )}
          </CardContent>
        </Card>

        {/* Right panel - Today planning */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h2 className="font-semibold text-white text-sm sm:text-base mb-4">🌅 Rencana Hari Ini</h2>

            {/* Energy */}
            <div className="mb-4">
              <label className="text-xs sm:text-sm text-slate-400 block mb-2">Level Energi</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setEnergy(n)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-medium text-sm transition-all ${energy === n ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-105' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Intention */}
            <div className="mb-4">
              <label className="text-xs sm:text-sm text-slate-400 block mb-2">Niat Hari Ini</label>
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5">
                <span className="text-slate-500 text-xs sm:text-sm flex-shrink-0 hidden sm:inline">Hari ini saya fokus pada</span>
                <input value={intention} onChange={e => setIntention(e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600 min-w-0"
                  placeholder="Fokus hari ini..." />
              </div>
            </div>

            {/* 3 tasks */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm text-slate-400">3 Deep Work Tasks</label>
                {totalHours > 0 && (
                  <span className={`text-[10px] sm:text-xs ${totalHours > 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                    Total: {totalHours}j {totalHours > 3 && '⚠️'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {selectedTasks.map((sel, i) => (
                  <div key={i} className="flex gap-2">
                    <select value={sel.task_id}
                      onChange={e => {
                        const task = allTasks.find((t: any) => t.id === e.target.value);
                        const next = [...selectedTasks];
                        next[i] = { task_id: e.target.value, task_title: task?.title || '', duration: sel.duration };
                        setSelectedTasks(next);
                      }}
                      className="flex-1 h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-0 transition-colors">
                      <option value="">-- pilih task --</option>
                      {sortedTasks.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {carryoverIds.includes(t.id) ? '🔄 ' : ''}{t.title} [{t.work_type}]
                        </option>
                      ))}
                    </select>
                    <select value={sel.duration}
                      onChange={e => { const next = [...selectedTasks]; next[i].duration = e.target.value; setSelectedTasks(next); }}
                      className="w-20 sm:w-24 h-9 sm:h-10 px-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-[10px] sm:text-xs focus:outline-none transition-colors">
                      {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => saveSprint.mutate()} className="w-full" disabled={saveSprint.isPending}>
              {saveSprint.isPending ? 'Menyimpan...' : '🚀 Mulai Sprint'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {showEod && yesterdaySprint && (
        <EODModal sprint={yesterdaySprint} onClose={() => { setShowEod(false); qc.invalidateQueries({ queryKey: ['sprint', yesterday] }); }} />
      )}
    </div>
  );
}
