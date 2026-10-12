'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ROLES, IDEA_CATEGORIES, IDEA_STATUSES, IDEA_PRIORITIES, IDEA_PRIORITY_COLORS } from '@/lib/constants';
import { Card, CardContent, Button, Dialog, Textarea, Input, Badge, EmptyState } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const STATUS_COLORS: Record<string, string> = { Mentah: 'slate', Diproses: 'warning', Dieksekusi: 'success' } as const;

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = IDEA_PRIORITY_COLORS[priority] || IDEA_PRIORITY_COLORS.P3;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
}

export default function IdeasPage() {
  const qc = useQueryClient();
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('Mentah');
  const [filterCat, setFilterCat] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [convertModal, setConvertModal] = useState<{ idea: any; type: 'task' | 'project' } | null>(null);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', deadline: '' });

  const { data: ideas = [] } = useQuery({ queryKey: ['ideas'], queryFn: () => fetcher('/api/ideas') });

  const updateIdea = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/ideas/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas'] }),
  });
  const deleteIdea = useMutation({
    mutationFn: (id: string) => fetch(`/api/ideas/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas'] }),
  });
  const convertToTask = useMutation({
    mutationFn: async (idea: any) => {
      const p = idea.priority || 'P3';
      const taskPriority = p === 'P1' ? 'Tinggi' : p === 'P4' ? 'Rendah' : 'Sedang';
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: idea.title, role: idea.role === 'Umum' ? 'CEO' : idea.role, priority: taskPriority, work_type: 'Shallow' }) });
      return fetch(`/api/ideas/${idea.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Dieksekusi' }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ideas'] }); qc.invalidateQueries({ queryKey: ['tasks'] }); setConvertModal(null); },
  });
  const convertToProject = useMutation({
    mutationFn: async (idea: any) => {
      await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: projectForm.name || idea.title, description: projectForm.description, role: idea.role === 'Umum' ? 'CEO' : idea.role, deadline: projectForm.deadline, idea_id: idea.id }) });
      return fetch(`/api/ideas/${idea.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Dieksekusi' }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ideas'] }); qc.invalidateQueries({ queryKey: ['projects'] }); setConvertModal(null); setProjectForm({ name: '', description: '', deadline: '' }); },
  });

  const filtered = ideas.filter((i: any) => {
    if (filterRole && i.role !== filterRole) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCat && i.category !== filterCat) return false;
    if (filterPriority && (i.priority || 'P3') !== filterPriority) return false;
    return true;
  });

  // Kategori dinamis: gabung daftar bawaan + kategori yang benar-benar ada di data (mis. "Telegram")
  const categoryOptions = Array.from(new Set<string>([
    ...IDEA_CATEGORIES,
    ...ideas.map((i: any) => i.category).filter((c: any) => !!c),
  ]));

  // Urutkan prioritas P1 → P4 (yang tidak punya priority dianggap P3)
  const prioRank: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
  const sorted = [...filtered].sort((a: any, b: any) =>
    (prioRank[a.priority || 'P3'] || 3) - (prioRank[b.priority || 'P3'] || 3)
  );

  const hasActiveFilters = filterRole || filterCat || filterPriority || (filterStatus && filterStatus !== 'Mentah');
  const resetFilters = () => { setFilterRole(''); setFilterCat(''); setFilterPriority(''); setFilterStatus(''); };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const bulkConvertToTask = async () => {
    const selected = ideas.filter((i: any) => selectedIds.includes(i.id));
    for (const idea of selected) await convertToTask.mutateAsync(idea);
    setSelectedIds([]);
  };
  const bulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} ide?`)) return;
    for (const id of selectedIds) await deleteIdea.mutateAsync(id);
    setSelectedIds([]);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Parkir Ide</h1>
          <p className="text-slate-400 text-sm">{ideas.filter((i: any) => i.status === 'Mentah').length} ide belum diproses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="">Semua Status</option>
          {IDEA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="">Semua Prioritas</option>
          {IDEA_PRIORITIES.map(p => <option key={p} value={p}>{IDEA_PRIORITY_COLORS[p]?.label || p}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="">Semua Peran</option>
          {[...ROLES, 'Umum'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
          <option value="">Semua Kategori</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="h-8 px-3 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">✕ Reset</button>
        )}
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <EmptyState  title="Belum ada ide" desc="Tekan Ctrl+Q untuk parkir ide baru" />
      ) : (
        <div className="space-y-2">
          {sorted.map((idea: any) => {
            const prioCfg = IDEA_PRIORITY_COLORS[idea.priority || 'P3'] || IDEA_PRIORITY_COLORS.P3;
            return (
            <div key={idea.id} className={`p-3 rounded-lg border-l-2 border-y border-r transition-colors ${prioCfg.border} ${selectedIds.includes(idea.id) ? 'bg-blue-500/5 border-r-blue-500/50' : 'border-r-transparent bg-slate-800/40'}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedIds.includes(idea.id)} onChange={() => toggleSelect(idea.id)} className="mt-1 w-4 h-4 accent-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{idea.title}</p>
                  {idea.description && <p className="text-slate-400 text-xs mt-0.5">{idea.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <PriorityBadge priority={idea.priority || 'P3'} />
                    <RoleBadge role={idea.role} />
                    <Badge variant="slate">{idea.category}</Badge>
                    <Badge variant={STATUS_COLORS[idea.status] as any}>{idea.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <select value={idea.priority || 'P3'} onChange={e => updateIdea.mutate({ id: idea.id, priority: e.target.value })}
                    className={`h-7 px-1.5 rounded-lg bg-slate-700 border-0 text-xs focus:outline-none ${prioCfg.text}`}>
                    {IDEA_PRIORITIES.map(p => <option key={p} value={p} className="text-slate-300">{p}</option>)}
                  </select>
                  <select value={idea.status} onChange={e => updateIdea.mutate({ id: idea.id, status: e.target.value })}
                    className="h-7 px-1.5 rounded-lg bg-slate-700 border-0 text-slate-300 text-xs focus:outline-none">
                    {IDEA_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button size="sm" variant="secondary" onClick={() => setConvertModal({ idea, type: 'task' })} className="h-7 text-xs px-2">→ Task</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setProjectForm({ name: idea.title, description: '', deadline: '' }); setConvertModal({ idea, type: 'project' }); }} className="h-7 text-xs px-2">→ Proyek</Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteIdea.mutate(idea.id)} className="h-7 w-7 text-red-400">🗑</Button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl z-30">
          <span className="text-sm text-white">{selectedIds.length} terpilih</span>
          <Button size="sm" onClick={bulkConvertToTask}>→ Jadikan Task</Button>
          <Button size="sm" variant="destructive" onClick={bulkDelete}>🗑 Hapus</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>✕</Button>
        </div>
      )}

      {/* Convert to task confirm */}
      <Dialog open={convertModal?.type === 'task'} onClose={() => setConvertModal(null)} title="→ Jadikan Task">
        <p className="text-slate-300 text-sm mb-4">Ide "<strong>{convertModal?.idea?.title}</strong>" akan dijadikan Task dengan role {convertModal?.idea?.role} dan work type Shallow.</p>
        <div className="flex gap-2">
          <Button onClick={() => convertToTask.mutate(convertModal!.idea)} className="flex-1">Konfirmasi</Button>
          <Button variant="outline" onClick={() => setConvertModal(null)}>Batal</Button>
        </div>
      </Dialog>

      {/* Convert to project */}
      <Dialog open={convertModal?.type === 'project'} onClose={() => setConvertModal(null)} title="→ Jadikan Proyek">
        <div className="space-y-3">
          <Input placeholder="Nama proyek" value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} />
          <Textarea placeholder="Deskripsi (opsional)" value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <Input type="date" value={projectForm.deadline} onChange={e => setProjectForm(p => ({ ...p, deadline: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={() => convertToProject.mutate(convertModal!.idea)} disabled={!projectForm.name.trim()} className="flex-1">Buat Proyek</Button>
            <Button variant="outline" onClick={() => setConvertModal(null)}>Batal</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
