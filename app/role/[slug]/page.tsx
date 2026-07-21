'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { use } from 'react';
import { ROLE_CONFIG } from '@/lib/constants';
import { Card, CardContent, Button, Input, Badge, EmptyState, ProgressBar } from '@/components/ui';
import { RoleBadge, WorkTypeBadge, PriorityDot } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const roleName = decodeURIComponent(slug);
  const qc = useQueryClient();
  const [quickInput, setQuickInput] = useState('');
  const cfg = ROLE_CONFIG[roleName];

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', roleName], queryFn: () => fetcher(`/api/tasks?role=${roleName}`) });
  const { data: projects = [] } = useQuery({ queryKey: ['projects', roleName], queryFn: () => fetcher(`/api/projects?role=${roleName}&status=Aktif`) });
  const { data: shopping = [] } = useQuery({
    queryKey: ['shopping', roleName],
    queryFn: () => fetcher('/api/shopping'),
    enabled: roleName === 'Suami' || roleName === 'Ayah',
  });

  const createTask = useMutation({
    mutationFn: (title: string) => fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, role: roleName, priority: 'Sedang', work_type: 'Admin' }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', roleName] }); setQuickInput(''); },
  });
  const toggleTask = useMutation({
    mutationFn: ({ id, completed }: any) => fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', roleName] }),
  });
  const addShop = useMutation({
    mutationFn: (name: string) => fetch('/api/shopping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, role: roleName }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping', roleName] }),
  });
  const toggleShop = useMutation({
    mutationFn: ({ id, archived }: any) => fetch(`/api/shopping/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping', roleName] }),
  });
  const delShop = useMutation({
    mutationFn: (id: string) => fetch(`/api/shopping/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping', roleName] }),
  });
  const bulkDelShop = async () => {
    const done = shopping.filter((s: any) => s.archived);
    for (const s of done) await delShop.mutateAsync(s.id);
  };

  const activeTasks = tasks.filter((t: any) => !t.completed);
  const doneTasks = tasks.filter((t: any) => t.completed);
  const [shopInput, setShopInput] = useState('');

  const bgGradient = cfg ? `from-${cfg.color}-900/20` : 'from-slate-900/20';

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className={`p-5 rounded-lg bg-gradient-to-r ${bgGradient} to-transparent border ${cfg?.border || 'border-slate-700/50'}`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cfg?.emoji || '⭐'}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{roleName}</h1>
            <p className="text-slate-400 text-sm">{activeTasks.length} task aktif · {projects.length} proyek</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Aktif', value: activeTasks.length },
            { label: 'Selesai', value: doneTasks.length },
            { label: 'Proyek', value: projects.length },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
        {tasks.length > 0 && <ProgressBar value={doneTasks.length} max={tasks.length} colorClass={`bg-${cfg?.color || 'blue'}-500`} className="mt-3" />}
      </div>

      {/* Quick add task */}
      <div className="flex gap-2">
        <Input placeholder={`Tambah task ${roleName}...`} value={quickInput} onChange={e => setQuickInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && quickInput.trim() && createTask.mutate(quickInput.trim())} />
        <Button onClick={() => quickInput.trim() && createTask.mutate(quickInput.trim())} size="sm">+</Button>
      </div>

      {/* Tasks */}
      <div>
        {activeTasks.length === 0 ? <EmptyState  title="Tidak ada task aktif" /> : (
          <div className="space-y-2">
            {activeTasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 bg-slate-800/40">
                <input type="checkbox" checked={false} onChange={() => toggleTask.mutate({ id: t.id, completed: true })} className="w-4 h-4 accent-blue-500 cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{t.title}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    <PriorityDot priority={t.priority} />
                    <WorkTypeBadge type={t.work_type} />
                    {t.due_date && <span className="text-xs text-slate-500">📅 {t.due_date}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {doneTasks.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">Selesai ({Math.min(doneTasks.length, 5)})</p>
            {doneTasks.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-2 text-slate-500">
                <span className="text-xs">✅</span>
                <p className="text-sm line-through">{t.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">Proyek Aktif</h2>
          <div className="space-y-2">
            {projects.map((p: any) => {
              const done = p.subtasks.filter((s: any) => s.completed).length;
              return (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    {p.subtasks.length > 0 && <div className="flex items-center gap-2 mt-1.5"><ProgressBar value={done} max={p.subtasks.length} className="flex-1" /><span className="text-xs text-slate-500">{done}/{p.subtasks.length}</span></div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Shopping list (Suami/Ayah only) */}
      {(roleName === 'Suami' || roleName === 'Ayah') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-slate-400">🛒 Daftar Belanja</h2>
            {shopping.some((s: any) => s.archived) && (
              <Button size="sm" variant="ghost" onClick={bulkDelShop} className="text-xs text-red-400">Hapus yang sudah dibeli</Button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <Input placeholder="Tambah barang..." value={shopInput} onChange={e => setShopInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && shopInput.trim() && addShop.mutate(shopInput.trim()) && setShopInput('')} />
            <Button size="sm" onClick={() => { if (shopInput.trim()) { addShop.mutate(shopInput.trim()); setShopInput(''); } }}>+</Button>
          </div>
          <div className="space-y-1">
            {shopping.length === 0 ? <p className="text-slate-500 text-sm text-center py-3">Daftar belanja kosong</p> : shopping.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/40">
                <input type="checkbox" checked={s.archived} onChange={e => toggleShop.mutate({ id: s.id, archived: e.target.checked })} className="w-4 h-4 accent-green-500 cursor-pointer" />
                <span className={`text-sm flex-1 ${s.archived ? 'line-through text-slate-500' : 'text-white'}`}>{s.name}</span>
                <Button size="icon" variant="ghost" onClick={() => delShop.mutate(s.id)} className="h-6 w-6 text-red-400 opacity-60 hover:opacity-100">✕</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
