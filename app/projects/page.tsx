'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ROLES, PROJECT_STATUSES } from '@/lib/constants';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, Badge, EmptyState, ProgressBar } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => fetcher('/api/projects') });

  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setEditItem(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const toggleSubtask = (project: any, idx: number) => {
    const subtasks = project.subtasks.map((s: any, i: number) => i === idx ? { ...s, completed: !s.completed } : s);
    update.mutate({ id: project.id, subtasks });
  };

  const filtered = projects.filter((p: any) => !filterStatus || p.status === filterStatus);
  const STATUS_COLORS: Record<string, any> = { Aktif: 'success', Selesai: 'default', Ditunda: 'warning' };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🗂 Proyek</h1>
          <p className="text-slate-400 text-sm">{projects.filter((p: any) => p.status === 'Aktif').length} aktif</p>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="">Semua</option>
          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗂" title="Belum ada proyek" desc="Buat proyek dari halaman Parkir Ide" />
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => {
            const done = p.subtasks.filter((s: any) => s.completed).length;
            const isExpanded = expanded === p.id;
            return (
              <Card key={p.id}>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-white text-sm">{p.name}</h3>
                        <RoleBadge role={p.role} />
                        <Badge variant={STATUS_COLORS[p.status]}>{p.status}</Badge>
                      </div>
                      {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                      {p.deadline && <p className="text-xs text-slate-500 mt-0.5">📅 Deadline: {p.deadline}</p>}
                      {p.subtasks.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <ProgressBar value={done} max={p.subtasks.length} colorClass="bg-blue-500" className="flex-1" />
                            <span className="text-xs text-slate-500">{done}/{p.subtasks.length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <select value={p.status} onChange={e => update.mutate({ id: p.id, status: e.target.value })}
                        className="h-7 px-1.5 rounded-lg bg-slate-700 border-0 text-slate-300 text-xs focus:outline-none">
                        {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <Button size="icon" variant="ghost" onClick={() => setExpanded(isExpanded ? null : p.id)} className="h-7 w-7">
                        {isExpanded ? '▲' : '▼'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditForm({ ...p, subtasks: p.subtasks.map((s: any) => s.title).join('\n') }); setEditItem(p); }} className="h-7 w-7">✏️</Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm('Hapus proyek?')) del.mutate(p.id); }} className="h-7 w-7 text-red-400">🗑</Button>
                    </div>
                  </div>

                  {isExpanded && p.subtasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                      {p.subtasks.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2" onClick={() => toggleSubtask(p, i)}>
                          <input type="checkbox" checked={s.completed} readOnly className="w-4 h-4 accent-blue-500 cursor-pointer" />
                          <span className={`text-sm cursor-pointer ${s.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{s.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Proyek">
        {editItem && (
          <div className="space-y-3">
            <Input value={editForm.name} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nama proyek" />
            <Textarea value={editForm.description || ''} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Deskripsi" />
            <Input type="date" value={editForm.deadline || ''} onChange={e => setEditForm((p: any) => ({ ...p, deadline: e.target.value }))} />
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Subtasks (satu per baris)</label>
              <Textarea value={editForm.subtasks} onChange={e => setEditForm((p: any) => ({ ...p, subtasks: e.target.value }))} rows={4} placeholder="Subtask 1&#10;Subtask 2" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                const subtasks = editForm.subtasks.split('\n').filter((s: string) => s.trim()).map((title: string) => {
                  const existing = editItem.subtasks.find((s: any) => s.title === title.trim());
                  return { title: title.trim(), completed: existing?.completed || false };
                });
                update.mutate({ id: editItem.id, name: editForm.name, description: editForm.description, deadline: editForm.deadline, subtasks });
              }} className="flex-1">Simpan</Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
