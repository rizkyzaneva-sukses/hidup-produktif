'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { LEARNING_TYPES } from '@/lib/constants';
import { todayStr } from '@/lib/utils';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, Badge, EmptyState } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const TARGETS: Record<string, number> = { Buku: 4, Podcast: 20, Video: 20, Artikel: 20 };

export default function LearningPage() {
  const qc = useQueryClient();
  const today = todayStr();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editInsight, setEditInsight] = useState<Record<string, string>>({});
  const emptyForm = { title: '', type: 'Buku', insight: '', duration_minutes: '', log_date: today, finished: false };
  const [form, setForm] = useState(emptyForm);

  const { data: logs = [] } = useQuery({ queryKey: ['learning'], queryFn: () => fetcher('/api/learning') });

  const create = useMutation({
    mutationFn: (d: any) => fetch('/api/learning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, duration_minutes: parseInt(d.duration_minutes) || null }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning'] }); setShowForm(false); setForm(emptyForm); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/learning/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning'] }); setEditItem(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/learning/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning'] }),
  });

  // Stats
  const getStreak = () => {
    let streak = 0;
    let d = new Date();
    while (logs.some((l: any) => l.log_date === format(d, 'yyyy-MM-dd'))) {
      streak++;
      d = subDays(d, 1);
    }
    return streak;
  };

  const monthStart = startOfMonth(new Date());
  const thisMonth = logs.filter((l: any) => l.log_date >= format(monthStart, 'yyyy-MM-dd'));
  const totalMinutes = logs.reduce((s: number, l: any) => s + (l.duration_minutes || 0), 0);
  const booksFinished = thisMonth.filter((l: any) => l.type === 'Buku' && l.finished).length;
  const insightCount = thisMonth.filter((l: any) => l.insight?.trim()).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📚 Log Belajar</h1>
          <p className="text-slate-400 text-sm">{logs.length} entri total</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Log Baru</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Streak', value: `${getStreak()} hari`, icon: '🔥' },
          { label: 'Total Jam', value: `${Math.round(totalMinutes / 60)}j`, icon: '⏱' },
          { label: 'Insight Bulan Ini', value: `${insightCount}/${TARGETS.Artikel}`, icon: '💡' },
          { label: 'Buku Selesai', value: `${booksFinished}/${TARGETS.Buku}`, icon: '📖' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl">{s.icon}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs list */}
      {logs.length === 0 ? <EmptyState icon="📚" title="Belum ada log belajar" /> : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/40">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{log.title}</p>
                    <Badge variant={log.type === 'Buku' ? 'default' : log.type === 'Podcast' ? 'purple' : log.type === 'Video' ? 'warning' : 'slate'}>{log.type}</Badge>
                    {log.finished && <Badge variant="success">✅ Selesai</Badge>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {log.log_date && <span className="text-xs text-slate-500">📅 {log.log_date}</span>}
                    {log.duration_minutes && <span className="text-xs text-slate-500">⏱ {log.duration_minutes} mnt</span>}
                  </div>
                  {editInsight[log.id] !== undefined ? (
                    <div className="mt-2 space-y-2">
                      <Textarea value={editInsight[log.id]} onChange={e => setEditInsight(p => ({ ...p, [log.id]: e.target.value }))} rows={2} placeholder="Insight utama..." />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { update.mutate({ id: log.id, insight: editInsight[log.id] }); setEditInsight(p => { const n = { ...p }; delete n[log.id]; return n; }); }}>Simpan</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditInsight(p => { const n = { ...p }; delete n[log.id]; return n; })}>Batal</Button>
                      </div>
                    </div>
                  ) : log.insight ? (
                    <p className="text-xs text-slate-400 mt-1.5 bg-slate-700/40 rounded-lg px-2 py-1">💡 {log.insight}</p>
                  ) : null}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setEditInsight(p => ({ ...p, [log.id]: log.insight || '' }))} className="h-7 w-7">✏️</Button>
                  <Button size="icon" variant="ghost" onClick={() => update.mutate({ id: log.id, finished: !log.finished })} className="h-7 w-7">
                    {log.finished ? '📖' : '✅'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(log.id)} className="h-7 w-7 text-red-400">🗑</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="📚 Log Belajar Baru">
        <div className="space-y-3">
          <Input placeholder="Judul *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select options={LEARNING_TYPES.map(t => ({ value: t, label: t }))} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
            <Input placeholder="Durasi (menit)" type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
            <Input type="date" value={form.log_date} onChange={e => setForm(p => ({ ...p, log_date: e.target.value }))} className="col-span-2" />
          </div>
          <Textarea placeholder="Insight utama (opsional)" value={form.insight} onChange={e => setForm(p => ({ ...p, insight: e.target.value }))} rows={2} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.finished} onChange={e => setForm(p => ({ ...p, finished: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm text-slate-300">Sudah selesai / tamat</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={() => { if (!form.title.trim()) return; create.mutate(form); }} className="flex-1">Simpan</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
