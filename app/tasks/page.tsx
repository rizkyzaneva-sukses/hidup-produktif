'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useMemo } from 'react';
import { ROLES, PRIORITIES, WORK_TYPES } from '@/lib/constants';
import { isOverdue, isTodayDate, isFutureDate, formatDateShort } from '@/lib/utils';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, EmptyState, Badge } from '@/components/ui';
import { RoleBadge, WorkTypeBadge, PriorityDot } from '@/components/shared/badges';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Task { id: string; title: string; role: string; priority: string; work_type: string; completed: boolean; notes?: string; due_date?: string; project_id?: string; project_name?: string; }

function TaskForm({ task, onSave, onCancel, customRoles, projects }: { task?: Task; onSave: (data: any) => void; onCancel: () => void; customRoles: string[]; projects: any[] }) {
  const allRoles = [...ROLES, ...customRoles];
  const [form, setForm] = useState({
    title: task?.title || '',
    role: task?.role || 'CEO',
    priority: task?.priority || 'Sedang',
    work_type: task?.work_type || 'Admin',
    due_date: task?.due_date || '',
    notes: task?.notes || '',
    project_id: task?.project_id || '',
  });
  const submit = () => { if (!form.title.trim()) return; onSave(form); };
  return (
    <div className="space-y-3" onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') submit(); }}>
      <Input placeholder="Judul task *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Select options={allRoles.map(r => ({ value: r, label: r }))} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
        <Select options={PRIORITIES.map(p => ({ value: p, label: p }))} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} />
        <Select options={WORK_TYPES.map(w => ({ value: w, label: w }))} value={form.work_type} onChange={e => setForm(p => ({ ...p, work_type: e.target.value }))} />
        <div className="relative">
          <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          {!form.due_date && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">📅 Due date</span>}
        </div>
      </div>
      <select
        value={form.project_id}
        onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
        className="w-full h-10 sm:h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
      >
        <option value="">Tanpa Project</option>
        {projects.map((p: any) => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
      </select>
      <Textarea placeholder="Notes (opsional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
      <div className="flex gap-2">
        <Button onClick={submit} className="flex-1">Simpan <span className="ml-1 text-[10px] opacity-50">Ctrl+↵</span></Button>
        <Button variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </div>
  );
}

type DropdownType = 'role' | 'priority' | 'worktype' | 'project' | null;

const ITEMS_PER_PAGE = 10;
const DONE_PREVIEW_COUNT = 3;

export default function TasksPage() {
  const qc = useQueryClient();
  const [filterRole, setFilterRole] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [quickDropdown, setQuickDropdown] = useState<DropdownType>(null);
  const [quickHighlight, setQuickHighlight] = useState(0);
  const quickRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [showAllDone, setShowAllDone] = useState(false);
  const [donePage, setDonePage] = useState(1);

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => fetcher('/api/tasks') });
  const { data: customRoles = [] } = useQuery({ queryKey: ['custom-roles'], queryFn: () => fetcher('/api/custom-roles') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => fetcher('/api/projects') });
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

  const filtered = useMemo(() => tasks.filter((t: any) => {
    if (filterRole && t.role !== filterRole) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterWorkType && t.work_type !== filterWorkType) return false;
    if (filterProject && t.project_id !== filterProject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [tasks, filterRole, filterPriority, filterWorkType, filterProject, searchQuery]);

  const active = filtered.filter((t: any) => !t.completed);
  const done = filtered.filter((t: any) => t.completed);

  // Pagination for active tasks
  const totalActivePages = Math.ceil(active.length / ITEMS_PER_PAGE);
  const paginatedActive = active.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  // Show only 3 done tasks initially, then paginate when expanded
  const totalDonePages = Math.ceil(done.length / ITEMS_PER_PAGE);
  const visibleDone = showAllDone
    ? done.slice((donePage - 1) * ITEMS_PER_PAGE, donePage * ITEMS_PER_PAGE)
    : done.slice(0, DONE_PREVIEW_COUNT);

  // Get current dropdown options based on type
  const getQuickOpts = (): string[] => {
    const last = quickInput.split(' ').pop() || '';
    if (quickDropdown === 'role') {
      const q = last.startsWith('@') ? last.slice(1).toLowerCase() : '';
      return allRoles.filter(r => !q || r.toLowerCase().startsWith(q));
    }
    if (quickDropdown === 'priority') {
      const q = last.startsWith('#') ? last.slice(1).toLowerCase() : '';
      return PRIORITIES.filter(p => !q || p.toLowerCase().startsWith(q));
    }
    if (quickDropdown === 'worktype') {
      const q = last.startsWith('$') ? last.slice(1).toLowerCase() : '';
      return WORK_TYPES.filter(w => !q || w.toLowerCase().replace(/\s/g, '').startsWith(q));
    }
    if (quickDropdown === 'project') {
      const q = last.startsWith('%') ? last.slice(1).toLowerCase() : '';
      return projects.filter((p: any) => !q || p.name.toLowerCase().startsWith(q)).map((p: any) => p.name);
    }
    return [];
  };

  const quickOpts = getQuickOpts();

  const quickAdd = async () => {
    if (!quickInput.trim()) return;
    let title = quickInput.trim();
    let role = 'CEO';
    let priority = 'Sedang';
    let work_type = 'Admin';
    let project_id = '';

    // Parse @role
    const roleMatch = title.match(/@(\w+)/);
    if (roleMatch) {
      const matched = allRoles.find(r => r.toLowerCase() === roleMatch[1].toLowerCase());
      if (matched) role = matched;
      title = title.replace(roleMatch[0], '').trim();
    }
    // Parse #priority
    const prioMatch = title.match(/#(\w+)/);
    if (prioMatch) {
      const matched = PRIORITIES.find(p => p.toLowerCase() === prioMatch[1].toLowerCase());
      if (matched) priority = matched;
      title = title.replace(prioMatch[0], '').trim();
    }
    // Parse $worktype
    const wtMatch = title.match(/\$(\w+)/);
    if (wtMatch) {
      const matched = WORK_TYPES.find(w => w.toLowerCase().replace(/\s/g, '') === wtMatch[1].toLowerCase());
      if (matched) work_type = matched;
      title = title.replace(wtMatch[0], '').trim();
    }
    // Parse %project
    const projMatch = title.match(/%(\w+)/);
    if (projMatch) {
      const matched = projects.find((p: any) => p.name.toLowerCase() === projMatch[1].toLowerCase());
      if (matched) project_id = matched.id;
      title = title.replace(projMatch[0], '').trim();
    }

    if (!title) return;
    await createTask.mutateAsync({ title, role, priority, work_type, project_id: project_id || undefined });
    setQuickInput('');
    setQuickDropdown(null);
    setQuickHighlight(0);
  };

  const handleQuickChange = (val: string) => {
    setQuickInput(val);
    const last = val.split(' ').pop() || '';
    if (last.startsWith('@')) { setQuickDropdown('role'); setQuickHighlight(0); }
    else if (last.startsWith('#')) { setQuickDropdown('priority'); setQuickHighlight(0); }
    else if (last.startsWith('$')) { setQuickDropdown('worktype'); setQuickHighlight(0); }
    else if (last.startsWith('%')) { setQuickDropdown('project'); setQuickHighlight(0); }
    else { setQuickDropdown(null); setQuickHighlight(0); }
  };

  const insertQuickTag = (value: string) => {
    const parts = quickInput.split(' ');
    const prefix = quickDropdown === 'role' ? '@' : quickDropdown === 'priority' ? '#' : quickDropdown === 'worktype' ? '$' : '%';
    parts[parts.length - 1] = `${prefix}${value.toLowerCase().replace(/\s/g, '')}`;
    setQuickInput(parts.join(' ') + ' ');
    setQuickDropdown(null);
    setQuickHighlight(0);
    quickRef.current?.focus();
  };

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (quickDropdown && quickOpts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setQuickHighlight(prev => (prev + 1) % quickOpts.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setQuickHighlight(prev => (prev - 1 + quickOpts.length) % quickOpts.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertQuickTag(quickOpts[quickHighlight]);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertQuickTag(quickOpts[quickHighlight]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuickDropdown(null);
        setQuickHighlight(0);
        return;
      }
    } else {
      if (e.key === 'Enter') quickAdd();
      if (e.key === 'Escape') { setQuickDropdown(null); setQuickHighlight(0); }
    }
  };

  const getDropdownPrefix = () => {
    if (quickDropdown === 'role') return '@';
    if (quickDropdown === 'priority') return '#';
    if (quickDropdown === 'worktype') return '$';
    if (quickDropdown === 'project') return '%';
    return '';
  };

  const hasActiveFilters = filterRole || filterPriority || filterWorkType || filterProject || searchQuery;

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
          {task.project_name && (
            <span className="text-[10px] sm:text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">📁 {task.project_name}</span>
          )}
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

  // Reset page when filters/search change
  const resetPages = () => { setActivePage(1); setDonePage(1); setShowAllDone(false); };

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

      {/* Search box */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Cari task..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); resetPages(); }}
          className="w-full h-9 sm:h-10 pl-9 pr-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); resetPages(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
        )}
      </div>

      {/* Quick add */}
      <div className="relative">
        <div className="flex gap-2">
          <Input ref={quickRef} placeholder="Task cepat... @role #prioritas $tipe %project" value={quickInput} onChange={e => handleQuickChange(e.target.value)} onKeyDown={handleQuickKeyDown} />
          <Button onClick={quickAdd} size="sm" className="flex-shrink-0">+</Button>
        </div>
        {quickDropdown && quickOpts.length > 0 && (
          <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
            {quickOpts.map((opt, idx) => (
              <button
                key={opt}
                onClick={() => insertQuickTag(opt)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  idx === quickHighlight ? 'bg-blue-600/30 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {getDropdownPrefix()}{opt.toLowerCase().replace(/\s/g, '')}
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-1">@role · #tinggi/sedang/rendah · $deepwork/admin/shallow · %project</p>
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
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); resetPages(); }} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Peran</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); resetPages(); }} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Prioritas</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterWorkType} onChange={e => { setFilterWorkType(e.target.value); resetPages(); }} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Tipe</option>
            {WORK_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={filterProject} onChange={e => { setFilterProject(e.target.value); resetPages(); }} className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors">
            <option value="">Semua Project</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={() => { setFilterRole(''); setFilterPriority(''); setFilterWorkType(''); setFilterProject(''); setSearchQuery(''); resetPages(); }} className="h-8 sm:h-9 px-3 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-4">
          {active.length === 0 && done.length === 0 && <EmptyState icon="✅" title="Belum ada task" desc="Tambah task baru di atas" />}
          
          {/* Active tasks with pagination */}
          {active.length > 0 && (
            <div className="space-y-2">
              {paginatedActive.map((t: any) => <TaskRow key={t.id} task={t} />)}
              {totalActivePages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <button
                    onClick={() => setActivePage(p => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-slate-500">{activePage} / {totalActivePages}</span>
                  <button
                    onClick={() => setActivePage(p => Math.min(totalActivePages, p + 1))}
                    disabled={activePage === totalActivePages}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Completed tasks - show 3 initially with "Show More" */}
          {done.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-1 font-medium">Selesai ({done.length})</p>
              <div className="space-y-2">
                {visibleDone.map((t: any) => <TaskRow key={t.id} task={t} />)}
              </div>
              
              {/* Show More / pagination controls for done */}
              {!showAllDone && done.length > DONE_PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllDone(true)}
                  className="w-full mt-2 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors"
                >
                  Tampilkan semua ({done.length - DONE_PREVIEW_COUNT} lainnya) ▼
                </button>
              )}
              {showAllDone && totalDonePages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <button
                    onClick={() => setDonePage(p => Math.max(1, p - 1))}
                    disabled={donePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-slate-500">{donePage} / {totalDonePages}</span>
                  <button
                    onClick={() => setDonePage(p => Math.min(totalDonePages, p + 1))}
                    disabled={donePage === totalDonePages}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
              {showAllDone && (
                <button
                  onClick={() => { setShowAllDone(false); setDonePage(1); }}
                  className="w-full mt-2 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Sembunyikan ▲
                </button>
              )}
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
        <TaskForm customRoles={customRoleNames} projects={projects} onSave={data => createTask.mutate(data)} onCancel={() => setShowForm(false)} />
      </Dialog>
      <Dialog open={!!editTask} onClose={() => setEditTask(null)} title="✏️ Edit Task">
        {editTask && <TaskForm task={editTask} customRoles={customRoleNames} projects={projects} onSave={data => updateTask.mutate({ id: editTask.id, ...data })} onCancel={() => setEditTask(null)} />}
      </Dialog>
    </div>
  );
}
