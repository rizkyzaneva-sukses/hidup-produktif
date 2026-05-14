'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { LEARNING_TYPES } from '@/lib/constants';
import { todayStr } from '@/lib/utils';
import { Card, CardContent, Button, Input, Select, Dialog, Textarea, Badge, EmptyState } from '@/components/ui';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ── Rich Text Toolbar ────────────────────────────────────────────────────────
function InsightToolbar({ textareaRef, value, onChange }: { textareaRef: React.RefObject<HTMLTextAreaElement | null>; value: string; onChange: (v: string) => void }) {
  const insertAtCursor = useCallback((prefix: string, suffix = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const inserted = `${prefix}${selected}${suffix}`;
    const newValue = `${before}${inserted}${after}`;
    onChange(newValue);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  }, [textareaRef, value, onChange]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    if (selected.includes('\n')) {
      const lines = selected.split('\n');
      const prefixed = lines.map((line, i) => {
        if (prefix === '1. ') return `${i + 1}. ${line}`;
        return `${prefix}${line}`;
      }).join('\n');
      onChange(`${before}${prefixed}${after}`);
    } else {
      const lineStart = before.lastIndexOf('\n') + 1;
      const beforeLine = value.substring(0, lineStart);
      const currentLine = value.substring(lineStart, end);
      const newValue = `${beforeLine}${prefix}${currentLine}${after}`;
      onChange(newValue);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = start + prefix.length;
        ta.selectionEnd = end + prefix.length;
      }, 0);
    }
  }, [textareaRef, value, onChange]);

  const buttons = [
    { label: 'B', title: 'Bold', action: () => insertAtCursor('**', '**') },
    { label: 'I', title: 'Italic', action: () => insertAtCursor('_', '_') },
    { label: 'H', title: 'Heading', action: () => insertLinePrefix('### ') },
    { label: '•', title: 'Bullet list', action: () => insertLinePrefix('- ') },
    { label: '1.', title: 'Numbered list', action: () => insertLinePrefix('1. ') },
    { label: '✓', title: 'Checklist', action: () => insertLinePrefix('- [ ] ') },
    { label: '>', title: 'Quote', action: () => insertLinePrefix('> ') },
    { label: '—', title: 'Separator', action: () => insertAtCursor('\n---\n') },
  ];

  return (
    <div className="flex flex-wrap gap-1 mb-1">
      {buttons.map(b => (
        <button
          key={b.title}
          type="button"
          title={b.title}
          onClick={b.action}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

// ── Render Insight with formatting ───────────────────────────────────────────
function RenderInsight({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { type: 'ul' | 'ol' | 'check'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (!listItems) return;
    if (listItems.type === 'ol') {
      elements.push(<ol key={elements.length} className="list-decimal list-inside space-y-0.5 text-xs text-slate-300">{listItems.items.map((item, i) => <li key={i}>{item}</li>)}</ol>);
    } else {
      elements.push(<ul key={elements.length} className="list-disc list-inside space-y-0.5 text-xs text-slate-300">{listItems.items.map((item, i) => <li key={i}>{item}</li>)}</ul>);
    }
    listItems = null;
  };

  const formatInline = (line: string): React.ReactNode => {
    let result: React.ReactNode[] = [];
    const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
    parts.forEach((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        result.push(<strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>);
      } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
        result.push(<em key={i} className="italic">{part.slice(1, -1)}</em>);
      } else {
        result.push(<span key={i}>{part}</span>);
      }
    });
    return <>{result}</>;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed === '---' || trimmed === '***') {
      flushList();
      elements.push(<hr key={idx} className="border-slate-600 my-1" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<p key={idx} className="text-xs font-semibold text-white mt-1">{formatInline(trimmed.slice(4))}</p>);
      return;
    }

    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(<blockquote key={idx} className="border-l-2 border-blue-500/50 pl-2 text-xs text-slate-400 italic">{formatInline(trimmed.slice(2))}</blockquote>);
      return;
    }

    if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [ ] ')) {
      const checked = trimmed.startsWith('- [x] ');
      const content = trimmed.slice(6);
      if (!listItems || listItems.type !== 'check') {
        flushList();
        listItems = { type: 'check', items: [] };
      }
      listItems.items.push(
        <span className={checked ? 'line-through text-slate-500' : ''}>{checked ? '☑ ' : '☐ '}{formatInline(content)}</span>
      );
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!listItems || listItems.type !== 'ul') {
        flushList();
        listItems = { type: 'ul', items: [] };
      }
      listItems.items.push(formatInline(trimmed.slice(2)));
      return;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!listItems || listItems.type !== 'ol') {
        flushList();
        listItems = { type: 'ol', items: [] };
      }
      listItems.items.push(formatInline(olMatch[1]));
      return;
    }

    flushList();
    if (trimmed === '') {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      elements.push(<p key={idx} className="text-xs text-slate-300">{formatInline(trimmed)}</p>);
    }
  });

  flushList();

  return <div className="space-y-1 mt-1.5 bg-slate-700/40 rounded-lg px-2.5 py-2">{elements}</div>;
}

// ── Category Manager Dialog ──────────────────────────────────────────────────
function CategoryManager({ open, onClose, categories, onCreate, onDelete }: {
  open: boolean;
  onClose: () => void;
  categories: any[];
  onCreate: (data: { name: string; emoji: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📂');

  return (
    <Dialog open={open} onClose={onClose} title="📂 Kelola Kategori">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Emoji" value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 text-center" />
          <Input placeholder="Nama kategori baru" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
          <Button size="sm" onClick={() => {
            if (!name.trim()) return;
            onCreate({ name: name.trim(), emoji });
            setName('');
            setEmoji('📂');
          }}>+</Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {categories.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-sm text-white">{cat.emoji} {cat.name} <span className="text-slate-500 text-xs">({cat.log_count})</span></span>
                <Button size="icon" variant="ghost" onClick={() => onDelete(cat.id)} className="h-6 w-6 text-red-400 hover:text-red-300">✕</Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" onClick={onClose} className="w-full">Tutup</Button>
      </div>
    </Dialog>
  );
}

export default function LearningPage() {
  const qc = useQueryClient();
  const today = todayStr();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const emptyForm = { title: '', type: 'Buku', insight: '', duration_minutes: '', log_date: today, finished: false, category_id: '' };
  const [form, setForm] = useState(emptyForm);
  const insightRef = useRef<HTMLTextAreaElement>(null);
  const editInsightRef = useRef<HTMLTextAreaElement>(null);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (filterCategory) params.set('category_id', filterCategory);
    if (filterType) params.set('type', filterType);
    return params.toString();
  }, [searchQuery, filterCategory, filterType]);

  const { data: logs = [] } = useQuery({
    queryKey: ['learning', queryParams],
    queryFn: () => fetcher(`/api/learning${queryParams ? `?${queryParams}` : ''}`),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['learning-categories'],
    queryFn: () => fetcher('/api/learning-categories'),
  });

  const create = useMutation({
    mutationFn: (d: any) => fetch('/api/learning', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, duration_minutes: parseInt(d.duration_minutes) || null, category_id: d.category_id || null }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning'] }); qc.invalidateQueries({ queryKey: ['learning-categories'] }); setShowForm(false); setForm(emptyForm); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => fetch(`/api/learning/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning'] }); qc.invalidateQueries({ queryKey: ['learning-categories'] }); setEditItem(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/learning/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning'] }); qc.invalidateQueries({ queryKey: ['learning-categories'] }); },
  });

  // Category mutations
  const createCategory = useMutation({
    mutationFn: (d: { name: string; emoji: string }) => fetch('/api/learning-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning-categories'] }),
  });
  const deleteCategory = useMutation({
    mutationFn: (id: string) => fetch(`/api/learning-categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['learning-categories'] }); qc.invalidateQueries({ queryKey: ['learning'] }); },
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

  const totalMinutes = logs.reduce((s: number, l: any) => s + (l.duration_minutes || 0), 0);

  const openEdit = (log: any) => {
    setEditItem({
      id: log.id,
      title: log.title,
      type: log.type,
      insight: log.insight || '',
      duration_minutes: log.duration_minutes?.toString() || '',
      log_date: log.log_date || today,
      finished: log.finished,
      category_id: log.category_id || '',
    });
  };

  const hasActiveFilters = searchQuery || filterCategory || filterType;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📚 Log Belajar</h1>
          <p className="text-slate-400 text-sm">{logs.length} entri{hasActiveFilters ? ' (filtered)' : ' total'}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCategoryManager(true)}>📂</Button>
          <Button size="sm" onClick={() => setShowForm(true)}>+ Log Baru</Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <Input
          placeholder="🔍 Cari judul atau insight..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <Select
            options={[{ value: '', label: '📂 Semua Kategori' }, ...categories.map((c: any) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))]}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="flex-1 min-w-[140px]"
          />
          <Select
            options={[{ value: '', label: '📖 Semua Tipe' }, ...LEARNING_TYPES.map(t => ({ value: t, label: t }))]}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="flex-1 min-w-[120px]"
          />
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterType(''); }} className="text-slate-400 hover:text-white">
              ✕ Reset
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Streak', value: `${getStreak()} hari`, icon: '🔥' },
          { label: 'Total Jam', value: `${Math.round(totalMinutes / 60)}j`, icon: '⏱' },
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
      {logs.length === 0 ? <EmptyState icon="📚" title={hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada log belajar'} /> : (
        <div className="space-y-2">
          {logs.map((log: any) => (
            <div key={log.id} className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/40">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{log.title}</p>
                    <Badge variant={log.type === 'Buku' ? 'default' : log.type === 'Podcast' ? 'purple' : log.type === 'Video' ? 'warning' : 'slate'}>{log.type}</Badge>
                    {log.category && (
                      <Badge variant="slate" className="cursor-pointer" onClick={() => setFilterCategory(log.category_id)}>
                        {log.category.emoji} {log.category.name}
                      </Badge>
                    )}
                    {log.finished && <Badge variant="success">✅ Selesai</Badge>}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {log.log_date && <span className="text-xs text-slate-500">📅 {log.log_date}</span>}
                    {log.duration_minutes && <span className="text-xs text-slate-500">⏱ {log.duration_minutes} mnt</span>}
                  </div>
                  {log.insight && <RenderInsight text={log.insight} />}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(log)} className="h-7 w-7">✏️</Button>
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

      {/* Create Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="📚 Log Belajar Baru">
        <div className="space-y-3">
          <Input placeholder="Judul *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Select options={LEARNING_TYPES.map(t => ({ value: t, label: t }))} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
            <Input placeholder="Durasi (menit)" type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
            <Select
              options={[{ value: '', label: '📂 Pilih Kategori' }, ...categories.map((c: any) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))]}
              value={form.category_id}
              onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
              className="col-span-2"
            />
            <Input type="date" value={form.log_date} onChange={e => setForm(p => ({ ...p, log_date: e.target.value }))} className="col-span-2" />
          </div>
          <div>
            <InsightToolbar textareaRef={insightRef} value={form.insight} onChange={v => setForm(p => ({ ...p, insight: v }))} />
            <Textarea ref={insightRef} placeholder="Insight / catatan (opsional)&#10;&#10;Tips: Gunakan toolbar di atas untuk format:&#10;- Bullet point&#10;1. Numbered list&#10;**bold** _italic_" value={form.insight} onChange={e => setForm(p => ({ ...p, insight: e.target.value }))} rows={5} />
          </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="✏️ Edit Log Belajar">
        {editItem && (
          <div className="space-y-3">
            <Input placeholder="Judul *" value={editItem.title} onChange={e => setEditItem((p: any) => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Select options={LEARNING_TYPES.map(t => ({ value: t, label: t }))} value={editItem.type} onChange={e => setEditItem((p: any) => ({ ...p, type: e.target.value }))} />
              <Input placeholder="Durasi (menit)" type="number" value={editItem.duration_minutes} onChange={e => setEditItem((p: any) => ({ ...p, duration_minutes: e.target.value }))} />
              <Select
                options={[{ value: '', label: '📂 Pilih Kategori' }, ...categories.map((c: any) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))]}
                value={editItem.category_id}
                onChange={e => setEditItem((p: any) => ({ ...p, category_id: e.target.value }))}
                className="col-span-2"
              />
              <Input type="date" value={editItem.log_date} onChange={e => setEditItem((p: any) => ({ ...p, log_date: e.target.value }))} className="col-span-2" />
            </div>
            <div>
              <InsightToolbar textareaRef={editInsightRef} value={editItem.insight} onChange={v => setEditItem((p: any) => ({ ...p, insight: v }))} />
              <Textarea ref={editInsightRef} placeholder="Insight / catatan&#10;&#10;Tips: Gunakan toolbar di atas untuk format:&#10;- Bullet point&#10;1. Numbered list&#10;**bold** _italic_" value={editItem.insight} onChange={e => setEditItem((p: any) => ({ ...p, insight: e.target.value }))} rows={5} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editItem.finished} onChange={e => setEditItem((p: any) => ({ ...p, finished: e.target.checked }))} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-slate-300">Sudah selesai / tamat</span>
            </label>
            <div className="flex gap-2">
              <Button onClick={() => {
                if (!editItem.title.trim()) return;
                update.mutate({
                  id: editItem.id,
                  title: editItem.title,
                  type: editItem.type,
                  insight: editItem.insight,
                  duration_minutes: parseInt(editItem.duration_minutes) || null,
                  log_date: editItem.log_date,
                  finished: editItem.finished,
                  category_id: editItem.category_id || null,
                });
              }} className="flex-1">Simpan</Button>
              <Button variant="outline" onClick={() => setEditItem(null)}>Batal</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Category Manager */}
      <CategoryManager
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={categories}
        onCreate={(data) => createCategory.mutate(data)}
        onDelete={(id) => deleteCategory.mutate(id)}
      />
    </div>
  );
}
