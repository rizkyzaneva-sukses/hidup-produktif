'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ROLES, PROJECT_STATUSES } from '@/lib/constants';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, Badge, EmptyState, ProgressBar } from '@/components/ui';
import { RoleBadge } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SubSubTask { title: string; completed: boolean; }
interface SubTask { title: string; completed: boolean; children: SubSubTask[]; }
interface TaskNode { title: string; completed: boolean; children: SubTask[]; }

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

function countNodes(tasks: TaskNode[]) {
  let total = 0, done = 0;
  for (const t of tasks) {
    total++; if (t.completed) done++;
    for (const s of t.children) {
      total++; if (s.completed) done++;
      for (const ss of s.children) {
        total++; if (ss.completed) done++;
      }
    }
  }
  return { total, done };
}

function SubtaskEditor({ value, onChange }: { value: TaskNode[]; onChange: (v: TaskNode[]) => void }) {
  const set = (fn: (v: TaskNode[]) => TaskNode[]) => onChange(fn([...value]));

  const updateMain = (i: number, title: string) => set(v => { v[i] = { ...v[i], title }; return v; });
  const removeMain = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const addMain = () => onChange([...value, { title: '', completed: false, children: [] }]);

  const updateSub = (i: number, j: number, title: string) => set(v => {
    v[i] = { ...v[i], children: v[i].children.map((c, ci) => ci === j ? { ...c, title } : c) };
    return v;
  });
  const removeSub = (i: number, j: number) => set(v => {
    v[i] = { ...v[i], children: v[i].children.filter((_, ci) => ci !== j) };
    return v;
  });
  const addSub = (i: number) => set(v => {
    v[i] = { ...v[i], children: [...v[i].children, { title: '', completed: false, children: [] }] };
    return v;
  });

  const updateSubSub = (i: number, j: number, k: number, title: string) => set(v => {
    v[i].children[j] = { ...v[i].children[j], children: v[i].children[j].children.map((c, ci) => ci === k ? { ...c, title } : c) };
    return v;
  });
  const removeSubSub = (i: number, j: number, k: number) => set(v => {
    v[i].children[j] = { ...v[i].children[j], children: v[i].children[j].children.filter((_, ci) => ci !== k) };
    return v;
  });
  const addSubSub = (i: number, j: number) => set(v => {
    v[i].children[j] = { ...v[i].children[j], children: [...v[i].children[j].children, { title: '', completed: false }] };
    return v;
  });

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {value.map((task, i) => (
        <div key={i} className="border border-slate-700 rounded-xl p-2 space-y-1.5 bg-slate-800/30">
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 text-xs">●</span>
            <Input value={task.title} onChange={e => updateMain(i, e.target.value)} placeholder="Utama..." className="h-7 text-xs flex-1" />
            <button onClick={() => removeMain(i)} className="text-red-400 hover:text-red-300 text-sm px-1 flex-shrink-0">×</button>
          </div>
          <div className="pl-4 space-y-1.5">
            {task.children.map((sub, j) => (
              <div key={j} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-xs">└</span>
                  <Input value={sub.title} onChange={e => updateSub(i, j, e.target.value)} placeholder="Sub..." className="h-7 text-xs flex-1" />
                  <button onClick={() => removeSub(i, j)} className="text-red-400 hover:text-red-300 text-sm px-1 flex-shrink-0">×</button>
                </div>
                <div className="pl-5 space-y-1">
                  {sub.children.map((ss, k) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span className="text-slate-700 text-xs">└</span>
                      <Input value={ss.title} onChange={e => updateSubSub(i, j, k, e.target.value)} placeholder="Sub-sub..." className="h-6 text-[11px] flex-1" />
                      <button onClick={() => removeSubSub(i, j, k)} className="text-red-400 hover:text-red-300 text-sm px-1 flex-shrink-0">×</button>
                    </div>
                  ))}
                  <button onClick={() => addSubSub(i, j)} className="text-[11px] text-slate-600 hover:text-slate-400 pl-4 transition-colors">+ sub-sub</button>
                </div>
              </div>
            ))}
            <button onClick={() => addSub(i)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">+ sub</button>
          </div>
        </div>
      ))}
      <button onClick={addMain} className="w-full text-xs text-blue-400 hover:text-blue-300 border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl py-2 transition-colors">
        + Tambah Utama
      </button>
    </div>
  );
}

interface CreateForm { name: string; description: string; role: string; deadline: string; subtasks: TaskNode[]; }

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('Aktif');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSubtasks, setEditSubtasks] = useState<TaskNode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ name: '', description: '', role: 'CEO', deadline: '', subtasks: [] });

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => fetcher('/api/projects') });
  const { data: customRoles = [] } = useQuery({ queryKey: ['custom-roles'], queryFn: () => fetcher('/api/custom-roles') });
  const allRoles = [...ROLES, ...customRoles.map((r: any) => r.name)];

  const create = useMutation({
    mutationFn: (data: any) => fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', role: 'CEO', deadline: '', subtasks: [] });
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
    if (k !== undefined && j !== undefined) {
      tasks[i].children[j].children[k].completed = !tasks[i].children[j].children[k].completed;
    } else if (j !== undefined) {
      tasks[i].children[j].completed = !tasks[i].children[j].completed;
    } else {
      tasks[i].completed = !tasks[i].completed;
    }
    update.mutate({ id: project.id, subtasks: tasks });
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
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none">
            <option value="">Semua</option>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button onClick={() => setShowCreate(true)} size="sm">+ Proyek</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗂" title="Belum ada proyek" desc="Buat proyek baru dengan tombol + Proyek" />
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
        <div className="space-y-3">
          <Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama proyek *" />
          <Textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Deskripsi (opsional)" />
          <div className="grid grid-cols-2 gap-2">
            <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
              className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Input type="date" value={createForm.deadline} onChange={e => setCreateForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Subtasks: Utama → Sub → Sub-sub</label>
            <SubtaskEditor value={createForm.subtasks} onChange={v => setCreateForm(p => ({ ...p, subtasks: v }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { if (!createForm.name.trim()) return; create.mutate(createForm); }} disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Membuat...' : 'Buat Proyek'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Proyek">
        {editItem && (
          <div className="space-y-3">
            <Input value={editForm.name} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nama proyek" />
            <Textarea value={editForm.description || ''} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Deskripsi" />
            <div className="grid grid-cols-2 gap-2">
              <select value={editForm.role || 'CEO'} onChange={e => setEditForm((p: any) => ({ ...p, role: e.target.value }))}
                className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Input type="date" value={editForm.deadline || ''} onChange={e => setEditForm((p: any) => ({ ...p, deadline: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Subtasks: Utama → Sub → Sub-sub</label>
              <SubtaskEditor value={editSubtasks} onChange={setEditSubtasks} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => update.mutate({ id: editItem.id, ...editForm, subtasks: editSubtasks })} disabled={update.isPending} className="flex-1">
                {update.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
