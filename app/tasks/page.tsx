'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { ROLES, PRIORITIES, WORK_TYPES } from '@/lib/constants';
import { isOverdue, isTodayDate, isFutureDate, formatDateShort } from '@/lib/utils';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, EmptyState, Badge } from '@/components/ui';
import { RoleBadge, WorkTypeBadge, PriorityDot } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Task { id: string; title: string; role: string; priority: string; work_type: string; completed: boolean; notes?: string; due_date?: string; }

function TaskForm({ task, onSave, onCancel, customRoles }: { task?: Task; onSave: (data: any) => void; onCancel: () => void; customRoles: string[] }) {
  const allRoles = [...ROLES, ...customRoles];
  const [form, setForm] = useState({ title: task?.title || '', role: task?.role || 'CEO', priority: task?.priority || 'Sedang', work_type: task?.work_type || 'Admin', due_date: task?.due_date || '', notes: task?.notes || '' });
  return (
    <div className="space-y-3">
      <Input placeholder="Judul task *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Select options={allRoles.map(r => ({ value: r, label: r }))} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
        <Select options={PRIORITIES.map(p => ({ value: p, label: p }))} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} />
        <Select options={WORK_TYPES.map(w => ({ value: w, label: w }))} value={form.work_type} onChange={e => setForm(p => ({ ...p, work_type: e.target.value }))} />
        <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
      </div>
      <Textarea placeholder="Notes (opsional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
      <div className="flex gap-2">
        <Button onClick={() => { if (!form.title.trim()) return; onSave(form); }} className="flex-1">Simpan</Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const qc = useQueryClient();
  const [filterRole, setFilterRole] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickDropdown, setQuickDropdown] = useState(false);
  const quickRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => fetcher('/api/tasks') });
  const { data: customRoles = [] } = useQuery({ queryKey: ['custom-roles'], queryFn: () => fetcher('/api/custom-roles') });
  const customRoleNames = customRoles.map((r: any) => r.name);
  const allRoles = [...ROLES, ...customRoleNames];

  const createTask = useMutation({
    mutationFn: (data: any) => fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); },
  });
  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: any) => fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setEditTask(null); },
  });
  const deleteTask = useMutation({
    mutationFn: (id: string) => fetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filtered = tasks.filter((t: any) => {
    if (filterRole && t.role !== filterRole) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterWorkType && t.work_type !== filterWorkType) return false;
    return true;
  });

  const active = filtered.filter((t: any) => !t.completed);
  const done = filtered.filter((t: any) => t.completed);

  const quickAdd = async () => {
    if (!quickInput.trim()) return;
    let title = quickInput.trim();
    let role = 'CEO';
    const roleMatch = title.match(/@(\w+)/);
    if (roleMatch) {
      const matched = allRoles.find(r => r.toLowerCase() === roleMatch[1].toLowerCase());
      if (matched) role = matched;
      title = title.replace(roleMatch[0], '').trim();
    }
    await createTask.mutateAsync({ title, role, priority: 'Sedang', work_type: 'Admin' });
    setQuickInput('');
    setQuickDropdown(false);
  };

  const handleQuickChange = (val: string) => {
    setQuickInput(val);
    const last = val.split(' ').pop() || '';
    setQuickDropdown(last.startsWith('@'));
  };

  const insertQuickRole = (role: string) => {
    const parts = quickInput.split(' ');
    parts[parts.length - 1] = `@${role.toLowerCase()}`;
    setQuickInput(parts.join(' ') + ' ');
    setQuickDropdown(false);
    quickRef.current?.focus();
  };

  const quickLast = quickInput.split(' ').pop() || '';
  const quickRoleQ = quickLast.startsWith('@') ? quickLast.slice(1).toLowerCase() : '';
  const quickRoleOpts = allRoles.filter(r => !quickRoleQ || r.toLowerCase().startsWith(quickRoleQ));

  const hasActiveFilters = filterRole || filterPriority || filterWorkType;

  const TaskRow = ({ task }: { task: Task }) => (
    <div className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
      task.completed 
        ? 'border-slate-700/30 bg-slate-800/20' 
        : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600/50'
    } group`}>
      <input type="checkbox" checked={task.completed} onChange={e => updateTask.mutate({ id: task.id, completed: e.target.checked })} className="w-4 h-4 sm:w-5 sm:h-5 accent-blue-500 cursor-pointer mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5">
          <PriorityDot priority={task.priority} />
          <RoleBadge role={task.role} />
          <WorkTypeBadge type={task.work_type} />
          {task.due_date && (
            <span className={`text-[10px] sm:text-xs ${isOverdue(task.due_date) ? 'text-red-400' : isTodayDate(task.due_date) ? 'text-amber-400' : 'text-slate-500'}`}>
              📅 {formatDateShort(task.due_date)}
            </span>
          )}
        </div>
        {task.notes && <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">{task.notes}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:transition-opacity flex-shrink-0">
        <Button size="icon" variant="ghost" onClick={() => setEditTask(task)} className="h-7 w-7 sm:h-8 sm:w-8">✏️</Button>
        <Button size="icon" variant="ghost" onClick={() => deleteTask.mutate(task.id)} className="h-7 w-7 sm:h-8 sm:w-8 text-red-400">🗑</Button>
      </div>
      {/* Mobile action - long press or swipe alternative */}
      <button onClick={() => setEditTask(task)} className="sm:hidden flex-shrink-0 text-slate-500 p-1">⋮</button>
    </div>
  );

  // Kanban columns
  const kanbanCols = [
    { label: '🔴 Terlambat', tasks: active.filter((t: any) => isOverdue(t.due_date)) },
    { label: '📋 To Do', tasks: active.filter((t: any) => !t.due_date || isTodayDate(t.due_date)) },
    { label: '📅 Coming Soon', tasks: active.filter((t: any) => isFutureDate(t.due_date)) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white">✅ Tasks</h1>
          <p className="text-slate-400 text-xs sm:text-sm">{active.length} aktif · {done.length} selesai</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <button onClick={() => setView('list')} className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>List</button>
          <button onClick={() => setView('kanban')} className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-colors hidden sm:inline-flex ${view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>Kanban</button>
          <Button onClick={() => setShowForm(true)} size="sm">+ Task</Button>
        </div>
      </div>

      {/* Quick add */}
      <div className="relative">
        <div className="flex gap-2">
          <Input ref={quickRef} placeholder="Tambah task cepat... @role (Enter)" value={quickInput} onChange={e => handleQuickChange(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !quickDropdown) quickAdd();
            if (e.key === 'Tab' && quickDropdown) { e.preventDefault(); if (quickRoleOpts[0]) insertQuickRole(quickRoleOpts[0].toLowerCase()); }
            if (e.key === 'Escape') setQuickDropdown(false);
          }} />
          <Button onClick={quickAdd} size="sm" className="flex-shrink-0">+</Button>
        </div>
        {quickDropdown && quickRoleOpts.length > 0 && (
          <div className="absolute z-20 top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            {quickRoleOpts.map(r => (
              <button key={r} onClick={() => insertQuickRole(r.toLowerCase())} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                @{r.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters - collapsible on mobile */}
      <div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="sm:hidden flex items-center gap-2 text-xs text-slate-400 mb-2"
        >
          <span>🔍 Filter</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          <span>{showFilters ? '▲' : '▼'}</span>
        </button>
        <div className={`flex flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Peran</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Prioritas</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterWorkType} onChange={e => setFilterWorkType(e.target.value)} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Tipe</option>
            {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setFilterRole(''); setFilterPriority(''); setFilterWorkType(''); }} className="h-8 sm:h-9 px-3 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-4">
          {active.length === 0 && done.length === 0 && <EmptyState icon="✅" title="Belum ada task" desc="Tambah task baru di atas" />}
          {active.length > 0 && <div className="space-y-2">{active.map((t: any) => <TaskRow key={t.id} task={t} />)}</div>}
          {done.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1 font-medium">Selesai ({done.length})</p>
              <div className="space-y-2">{done.map((t: any) => <TaskRow key={t.id} task={t} />)}</div>
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kanbanCols.map(col => (
            <div key={col.label} className="bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-medium text-slate-300">{col.label}</h3>
                <Badge variant="slate">{col.tasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {col.tasks.length === 0 ? <p className="text-xs text-slate-600 text-center py-6">Kosong</p> : col.tasks.map((t: any) => <TaskRow key={t.id} task={t} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="➕ Tambah Task">
        <TaskForm customRoles={customRoleNames} onSave={data => createTask.mutate(data)} onCancel={() => setShowForm(false)} />
      </Dialog>
      <Dialog open={!!editTask} onClose={() => setEditTask(null)} title="✏️ Edit Task">
        {editTask && <TaskForm task={editTask} customRoles={customRoleNames} onSave={data => updateTask.mutate({ id: editTask.id, ...data })} onCancel={() => setEditTask(null)} />}
      </Dialog>
    </div>
  );
}
