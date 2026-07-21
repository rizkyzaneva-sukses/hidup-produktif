'use client';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ROLES, IDEA_CATEGORIES } from '@/lib/constants';
import { Button, Input } from '@/components/ui';

const ROLE_MAP: Record<string, string> = {
  ceo: 'CEO', suami: 'Suami', ayah: 'Ayah', anak: 'Anak', pelajar: 'Pelajar', umum: 'Umum',
};
const CAT_MAP: Record<string, string> = {
  bisnis: 'Bisnis', produk: 'Produk', farm: 'Maulana Farm', keuangan: 'Keuangan', personal: 'Personal', random: 'Random',
};

function parseInput(raw: string) {
  let title = raw;
  let role = 'Umum';
  let category = 'Random';
  const roleMatch = raw.match(/@(\w+)/);
  const catMatch = raw.match(/#(\w+)/);
  if (roleMatch) {
    role = ROLE_MAP[roleMatch[1].toLowerCase()] || 'Umum';
    title = title.replace(roleMatch[0], '').trim();
  }
  if (catMatch) {
    category = CAT_MAP[catMatch[1].toLowerCase()] || 'Random';
    title = title.replace(catMatch[0], '').trim();
  }
  return { title: title.trim(), role, category };
}

export function QuickCaptureFAB({ customRoles = [] }: { customRoles?: string[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dropdown, setDropdown] = useState<'role' | 'cat' | null>(null);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allRoles = [...ROLES, ...customRoles, 'Umum'];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleChange = (val: string) => {
    setInput(val);
    const last = val.split(' ').pop() || '';
    if (last.startsWith('@')) { setDropdown('role'); setHighlight(0); }
    else if (last.startsWith('#')) { setDropdown('cat'); setHighlight(0); }
    else { setDropdown(null); setHighlight(0); }
  };

  const getOpts = (): string[] => {
    const last = input.split(' ').pop() || '';
    if (dropdown === 'role') {
      const q = last.startsWith('@') ? last.slice(1).toLowerCase() : '';
      return allRoles.filter(r => !q || r.toLowerCase().startsWith(q));
    }
    if (dropdown === 'cat') {
      const q = last.startsWith('#') ? last.slice(1).toLowerCase() : '';
      return IDEA_CATEGORIES.filter(c => !q || c.toLowerCase().replace(' ', '').startsWith(q));
    }
    return [];
  };

  const currentOpts = getOpts();

  const handleSave = async () => {
    const { title, role, category } = parseInput(input);
    if (!title) return;
    setSaving(true);
    await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, role, category, status: 'Mentah' }),
    });
    setSaving(false);
    setSaved(true);
    setInput('');
    qc.invalidateQueries({ queryKey: ['ideas'] });
    setTimeout(() => setSaved(false), 1200);
  };

  const insertTag = (tag: string) => {
    const parts = input.split(' ');
    parts[parts.length - 1] = tag;
    setInput(parts.join(' ') + ' ');
    setDropdown(null);
    setHighlight(0);
    inputRef.current?.focus();
  };

  const insertFromOpts = (opt: string) => {
    if (dropdown === 'role') insertTag(`@${opt.toLowerCase()}`);
    else if (dropdown === 'cat') insertTag(`#${opt.toLowerCase().replace(' ', '')}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dropdown && currentOpts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight(prev => (prev + 1) % currentOpts.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight(prev => (prev - 1 + currentOpts.length) % currentOpts.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertFromOpts(currentOpts[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDropdown(null);
        setHighlight(0);
        return;
      }
    } else {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') setOpen(false);
    }
  };

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Parkir Ide (Ctrl+Q)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-xl sm:rounded-lg shadow-2xl p-4 sm:p-5 animate-slide-up sm:animate-none">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-semibold text-sm">Parkir Ide</h3>
              <span className="ml-auto text-xs text-slate-500 hidden sm:inline">Ctrl+Q</span>
              <button onClick={() => setOpen(false)} className="sm:hidden text-slate-500 hover:text-white p-1 rounded-md">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l12 12M13 1L1 13"/></svg>
              </button>
            </div>
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis ide... @role #kategori"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hidden sm:inline">Enter ↵</span>
            </div>

            {dropdown && currentOpts.length > 0 && (
              <div className="mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {currentOpts.map((opt, idx) => (
                  <button
                    key={opt}
                    onClick={() => insertFromOpts(opt)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      idx === highlight ? 'bg-blue-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {dropdown === 'role' ? '@' : '#'}{opt.toLowerCase().replace(' ', '')}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button onClick={handleSave} disabled={saving || !input.trim()} className="flex-1">
                {saved ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">@role dan #kategori opsional</p>
          </div>
        </div>
      )}
    </>
  );
}
