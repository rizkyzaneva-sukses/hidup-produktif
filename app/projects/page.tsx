'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { ROLES, PROJECT_STATUSES } from '@/lib/constants';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, Badge, EmptyState, ProgressBar } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SubSubTask { title: string; completed: boolean; }
interface SubTask { title: string; completed: boolean; children: SubSubTask[]; }
interface TaskNode { title: string; completed: boolean; children: SubTask[]; }
type FlatItem = { title: string; completed: boolean; level: 0 | 1 | 2; };

function normalize(raw: any[]): TaskNode[] {
  return (raw || []).map(item => ({
    title: item.title || '',
    completed: !!item.completed,
    children: (item.children || []).map((sub: any) => ({
      title: sub.title || '',
      completed: !!sub.completed,
      children: (sub.children || []).map((ss: any) => ({
        title: ss.title || '',
        completed: !!ss.completed,
      })),
    })),
  }));
}

function toFlat(nodes: TaskNode[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const n of nodes) {
    result.push({ title: n.title, completed: n.completed, level: 0 });
    for (const s of n.children) {
      result.push({ title: s.title, completed: s.completed, level: 1 });
      for (const ss of s.children) {
        result.push({ title: ss.title, completed: ss.completed, level: 2 });
      }
    }
  }
  return result;
}

function fromFlat(items: FlatItem[]): TaskNode[] {
  const nodes: TaskNode[] = [];
  let curNode: TaskNode | null = null;
  let curSub: SubTask | null = null;
  for (const item of items) {
    if (item.level === 0) {
      curNode = { title: item.title, completed: item.completed, children: [] };
      curSub = null;
      nodes.push(curNode);
    } else if (item.level === 1) {
      if (!curNode) { curNode = { title: '', completed: false, children: [] }; nodes.push(curNode); }
      curSub = { title: item.title, completed: item.completed, children: [] };
      curNode.children.push(curSub);
    } else {
      if (!curNode) { curNode = { title: '', completed: false, children: [] }; nodes.push(curNode); }
      if (!curSub) { curSub = { title: '', completed: false, children: [] }; curNode.children.push(curSub); }
      curSub.children.push({ title: item.title, completed: item.completed });
    }
  }
  return nodes;
}

function countNodes(tasks: TaskNode[]) {
  let total = 0, done = 0;
  for (const t of tasks) {
    total++; if (t.completed) done++;
    for (const s of t.children) {
      total++; if (s.completed) done++;
      for (const ss of s.children) { total++; if (ss.completed) done++; }
    }
  }
  return { total, done };
}

function SubtaskEditor({ value, onChange }: { value: TaskNode[]; onChange: (v: TaskNode[]) => void }) {
  const [items, setItems] = useState<FlatItem[]>(() => toFlat(value).length > 0 ? toFlat(value) : []);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (next: FlatItem[]) => {
    setItems(next);
    onChange(fromFlat(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItem: FlatItem = { title: '', completed: false, level: items[idx].level };
      const next = [...items];
      next.splice(idx + 1, 0, newItem);
      update(next);
      setTimeout(() => refs.current[idx + 1]?.focus(), 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const next = [...items];
      if (e.shiftKey) {
        if (next[idx].level > 0) next[idx] = { ...next[idx], level: (next[idx].level - 1) as 0 | 1 | 2 };
      } else {
        if (next[idx].level < 2) next[idx] = { ...next[idx], level: (next[idx].level + 1) as 0 | 1 | 2 };
      }
      update(next);
    } else if (e.key === 'Backspace' && items[idx].title === '' && items.length > 1) {
      e.preventDefault();
      const next = items.filter((_, i) => i !== idx);
      update(next);
      setTimeout(() => refs.current[Math.max(0, idx - 1)]?.focus(), 0);
    }
  };

  const INDENT = ['', 'pl-5', 'pl-10'] as const;
  const BULLET_COLOR = ['text-blue-400', 'text-slate-500', 'text-slate-700'] as const;
  const BULLET = ['●', '└', '└'] as const;
  const PH = ['Utama... (Enter=next, Tab=jorok, Shift+Tab=balik)', 'Sub...', 'Sub-sub...'] as const;
  const H = ['h-7', 'h-7', 'h-6'] as const;
  const FS = ['text-xs', 'text-xs', 'text-[11px]'] as const;

  return (
    <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
      {items.map((item, idx) => (
        <div key={idx} className={`flex items-center gap-1.5 ${INDENT[item.level]}`}>
          <span className={`${BULLET_COLOR[item.level]} text-xs flex-shrink-0`}>{BULLET[item.level]}</span>
          <input
            ref={el => { refs.current[idx] = el; }}
            value={item.title}
            onChange={e => { const next = [...items]; next[idx] = { ...next[idx], title: e.target.value }; update(next); }}
            onKeyDown={e => handleKeyDown(e, idx)}
            placeholder={PH[item.level]}
            className={`flex-1 ${H[item.level]} ${FS[item.level]} px-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50`}
          />
          <button onClick={() => update(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 text-sm px-1 flex-shrink-0">×</button>
        </div>
      ))}
      <button
        onClick={() => {
          const next = [...items, { title: '', completed: false, level: 0 as const }];
          update(next);
          setTimeout(() => refs.current[items.length]?.focus(), 0);
        }}
        className="w-full text-xs text-blue-400 hover:text-blue-300 border border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg py-2 transition-colors"
      >
        + Tambah Utama
      </button>
    </div>
  );
}

interface CreateForm { name: string; description: string; role: string; deadline: string; }

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSubtasks, setEditSubtasks] = useState<TaskNode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name: '', description: '', role: 'CEO', deadline: '' });
  const [createSubtasks, setCreateSubtasks] = useState<TaskNode[]>([]);

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => fetcher('/api/projects') });
  const { data: customRoles = [] } = useQuery({ queryKey: ['custom-roles'], queryFn: () => fetcher('/api/custom-roles') });
  const allRoles = [...ROLES, ...customRoles.map((r: any) => r.name)];

  const create = useMutation({
    mutationFn: (data: any) => fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', role: 'CEO', deadline: '' });
      setCreateSubtasks([]);
    },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setEditItem(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const toggleNode = (project: any, i: number, j?: number, k?: number) => {
    const tasks = normalize(project.subtasks);
    if (k !== undefined && j !== undefined) tasks[i].children[j].children[k].completed = !tasks[i].children[j].children[k].completed;
    else if (j !== undefined) tasks[i].children[j].completed = !tasks[i].children[j].completed;
    else tasks[i].completed = !tasks[i].completed;
    update.mutate({ id: project.id, subtasks: tasks });
  };

  const filtered = projects.filter((p: any) => !filterStatus || p.status === filterStatus);
  const STATUS_COLORS: Record<string, any> = { Aktif: 'success', Selesai: 'default', Ditunda: 'warning' };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Proyek</h1>
          <p className="text-slate-400 text-sm">{projects.filter((p: any) => p.status === 'Aktif').length} aktif</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
            <option value="">Semua</option>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button onClick={() => setShowCreate(true)} size="sm">+ Proyek</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState  title="Belum ada proyek" desc="Buat proyek baru dengan tombol + Proyek" />
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => {
            const tasks = normalize(p.subtasks);
            const { total, done } = countNodes(tasks);
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
                      {total > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <ProgressBar value={done} max={total} colorClass="bg-blue-500" className="flex-1" />
                          <span className="text-xs text-slate-500">{done}/{total}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <select value={p.status} onChange={e => update.mutate({ id: p.id, status: e.target.value })}
                        className="h-7 px-1.5 rounded-lg bg-slate-700 border-0 text-slate-300 text-xs focus:outline-none">
                        {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {total > 0 && (
                        <Button size="icon" variant="ghost" onClick={() => setExpanded(isExpanded ? null : p.id)} className="h-7 w-7">
                          {isExpanded ? '▲' : '▼'}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => {
                        setEditForm({ name: p.name, description: p.description || '', deadline: p.deadline || '', role: p.role || 'CEO' });
                        setEditSubtasks(normalize(p.subtasks));
                        setEditItem(p);
                      }} className="h-7 w-7">✏️</Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm('Hapus proyek?')) del.mutate(p.id); }} className="h-7 w-7 text-red-400">🗑</Button>
                    </div>
                  </div>

                  {isExpanded && tasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                      {tasks.map((task, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleNode(p, i)}>
                            <input type="checkbox" checked={task.completed} readOnly className="w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0" />
                            <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</span>
                          </div>
                          {task.children.map((sub, j) => (
                            <div key={j} className="pl-5 space-y-0.5">
                              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleNode(p, i, j)}>
                                <input type="checkbox" checked={sub.completed} readOnly className="w-3.5 h-3.5 accent-blue-500 cursor-pointer flex-shrink-0" />
                                <span className={`text-xs ${sub.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{sub.title}</span>
                              </div>
                              {sub.children.map((ss, k) => (
                                <div key={k} className="pl-5 flex items-center gap-2 cursor-pointer" onClick={() => toggleNode(p, i, j, k)}>
                                  <input type="checkbox" checked={ss.completed} readOnly className="w-3 h-3 accent-blue-500 cursor-pointer flex-shrink-0" />
                                  <span className={`text-[11px] ${ss.completed ? 'line-through text-slate-600' : 'text-slate-400'}`}>{ss.title}</span>
                                </div>
                              ))}
                            </div>
                          ))}
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

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="➕ Buat Proyek">
        <div className="space-y-3" onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter' && createForm.name.trim() && !create.isPending) create.mutate({ ...createForm, subtasks: createSubtasks }); }}>
          <Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama proyek *" />
          <Textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Deskripsi (opsional)" />
          <div className="grid grid-cols-2 gap-2">
            <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
              className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input type="date" value={createForm.deadline} onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subtasks — Enter: next, Tab: jorokin, Shift+Tab: balik</label>
            <SubtaskEditor key={showCreate ? 'create-open' : 'create-closed'} value={createSubtasks} onChange={setCreateSubtasks} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { if (!createForm.name.trim()) return; create.mutate({ ...createForm, subtasks: createSubtasks }); }} disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Membuat...' : 'Buat Proyek'} <span className="ml-1 text-xs opacity-50">Ctrl+↵</span>
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Proyek">
        {editItem && (
          <div className="space-y-3" onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter' && !update.isPending) update.mutate({ id: editItem.id, ...editForm, subtasks: editSubtasks }); }}>
            <Input value={editForm.name} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nama proyek" />
            <Textarea value={editForm.description || ''} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Deskripsi" />
            <div className="grid grid-cols-2 gap-2">
              <select value={editForm.role || 'CEO'} onChange={e => setEditForm((p: any) => ({ ...p, role: e.target.value }))}
                className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Input type="date" value={editForm.deadline || ''} onChange={e => setEditForm((p: any) => ({ ...p, deadline: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Subtasks — Enter: next, Tab: jorokin, Shift+Tab: balik</label>
              <SubtaskEditor key={editItem.id} value={editSubtasks} onChange={setEditSubtasks} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => update.mutate({ id: editItem.id, ...editForm, subtasks: editSubtasks })} disabled={update.isPending} className="flex-1">
                {update.isPending ? 'Menyimpan...' : 'Simpan'} <span className="ml-1 text-xs opacity-50">Ctrl+↵</span>
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
