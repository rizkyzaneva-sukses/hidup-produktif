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
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  
  const finishedCount = logs.filter((l: any) => l.finished).length;
  const finishedPercent = logs.length > 0 ? Math.round((finishedCount / logs.length) * 100) : 0;

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

  const typeBorderColors: Record<string, string> = {
    Buku: 'bg-blue-500',
    Podcast: 'bg-purple-500',
    Video: 'bg-yellow-500',
    Artikel: 'bg-slate-500'
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Log Belajar</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg">
            Lacak dan kelola semua progres belajar Anda. Lihat statistik, filter berdasarkan kategori, dan catat insight berharga. {logs.length > 0 && <span className="text-slate-500">— {logs.length} entri{hasActiveFilters ? ' (filtered)' : ' total'}</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="md" variant="secondary" onClick={() => setShowCategoryManager(true)}>📂 Kategori</Button>
          <Button size="md" onClick={() => setShowForm(true)}>+ Log Baru</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Streak Belajar', value: `${getStreak()} hari`, icon: '🔥', desc: 'Berturut-turut' },
          { label: 'Total Waktu', value: totalHours > 0 ? `${totalHours}j ${totalMins > 0 ? `${totalMins}m` : ''}`.trim() : `${totalMins}m`, icon: '⏱', desc: 'Durasi belajar' },
          { label: 'Selesai', value: `${finishedCount}`, icon: '✅', desc: `${finishedPercent}% dari total` },
        ].map(s => (
          <Card key={s.label}>
            <div className="p-4 flex items-center sm:flex-col sm:justify-center sm:text-center gap-4 sm:gap-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-700/40 flex items-center justify-center text-xl sm:text-2xl sm:mb-3 shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white leading-none">{s.value}</p>
                <div className="flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0 mt-1 sm:mt-1.5">
                  <p className="text-sm font-medium text-slate-300">{s.label}</p>
                  <p className="text-xs text-slate-500 hidden sm:block mt-0.5">{s.desc}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <Input
            placeholder="Cari judul atau insight..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800/80 border-slate-700/60 shadow-sm"
          />
        </div>
        <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
          <Select
            options={[{ value: '', label: 'Semua Kategori' }, ...categories.map((c: any) => ({ value: c.id, label: `${c.emoji} ${c.name}` }))]}
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-[140px] md:w-[160px] shrink-0 bg-slate-800/80 border-slate-700/60 shadow-sm"
          />
          <Select
            options={[{ value: '', label: 'Semua Tipe' }, ...LEARNING_TYPES.map(t => ({ value: t, label: t }))]}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-[120px] md:w-[140px] shrink-0 bg-slate-800/80 border-slate-700/60 shadow-sm"
          />
          {hasActiveFilters && (
            <Button size="md" variant="ghost" onClick={() => { setSearchQuery(''); setFilterCategory(''); setFilterType(''); }} className="text-slate-400 hover:text-white shrink-0 px-3">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Logs list */}
      {logs.length === 0 ? <EmptyState  title={hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada log belajar'} desc="Coba ubah filter atau tambah log baru" /> : (
        <div className="space-y-4">
          {logs.map((log: any) => (
            <div key={log.id} className={`group relative p-5 pl-6 rounded-lg border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all overflow-hidden shadow-sm hover:shadow-md ${log.finished ? 'opacity-60' : ''}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${typeBorderColors[log.type] || 'bg-slate-500'} opacity-80`} />
              
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                      <div className="flex items-center gap-2 flex-wrap mb-2.5">
                        <h3 className={`text-lg font-semibold tracking-tight ${log.finished ? 'text-slate-400 line-through decoration-slate-600' : 'text-white'}`}>{log.title}</h3>
                        {log.finished && <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs" title="Selesai">✓</span>}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.type === 'Buku' ? 'default' : log.type === 'Podcast' ? 'purple' : log.type === 'Video' ? 'warning' : 'slate'}>{log.type}</Badge>
                          {log.category && (
                            <Badge variant="slate" className="cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => setFilterCategory(log.category_id)}>
                              {log.category.emoji} {log.category.name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-l border-slate-700/60 pl-4">
                          {log.log_date && (
                            <span className="flex items-center gap-1.5" title="Tanggal">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {log.log_date}
                            </span>
                          )}
                          {log.duration_minutes > 0 && (
                            <span className="flex items-center gap-1.5" title="Durasi">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {Math.floor(log.duration_minutes / 60) > 0 ? `${Math.floor(log.duration_minutes / 60)}j ` : ''}{log.duration_minutes % 60 > 0 || Math.floor(log.duration_minutes / 60) === 0 ? `${log.duration_minutes % 60}m` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {log.insight && <div className="mt-2"><RenderInsight text={log.insight} /></div>}
                </div>
                
                <div className="flex sm:flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-700/50 sm:border-t-0 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => update.mutate({ id: log.id, finished: !log.finished })} className={`h-8 w-8 rounded-lg ${log.finished ? 'text-slate-400 hover:text-white' : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'}`} title={log.finished ? "Tandai belum selesai" : "Tandai selesai"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(log)} className="h-8 w-8 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" title="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(log.id)} className="h-8 w-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10" title="Hapus">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} title="Log Belajar Baru">
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
