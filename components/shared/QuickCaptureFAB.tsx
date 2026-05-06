'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dropdown, setDropdown] = useState<'role' | 'cat' | null>(null);
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
    if (last.startsWith('@')) setDropdown('role');
    else if (last.startsWith('#')) setDropdown('cat');
    else setDropdown(null);
  };

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
    setTimeout(() => setSaved(false), 1200);
  };

  const insertTag = (tag: string) => {
    const parts = input.split(' ');
    parts[parts.length - 1] = tag;
    setInput(parts.join(' ') + ' ');
    setDropdown(null);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* FAB button - positioned above bottom nav on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-white shadow-xl shadow-amber-500/30 flex items-center justify-center text-xl sm:text-2xl transition-all hover:scale-110 active:scale-95"
        title="Parkir Ide (Ctrl+Q)"
      >💡</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💡</span>
              <h3 className="text-white font-semibold text-sm sm:text-base">Parkir Ide</h3>
              <span className="ml-auto text-xs text-slate-500 hidden sm:inline">Ctrl+Q</span>
              <button onClick={() => setOpen(false)} className="sm:hidden text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
            </div>
            <div className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => handleChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !dropdown) handleSave();
                  if (e.key === 'Tab' && dropdown) {
                    e.preventDefault();
                    const last2 = input.split(' ').pop() || '';
                    if (dropdown === 'role') {
                      const q2 = last2.startsWith('@') ? last2.slice(1).toLowerCase() : '';
                      const first = allRoles.find(r => !q2 || r.toLowerCase().startsWith(q2));
                      if (first) insertTag(`@${first.toLowerCase()}`);
                    } else {
                      const q2 = last2.startsWith('#') ? last2.slice(1).toLowerCase() : '';
                      const first = IDEA_CATEGORIES.find(c => !q2 || c.toLowerCase().replace(' ', '').startsWith(q2));
                      if (first) insertTag(`#${first.toLowerCase().replace(' ', '')}`);
                    }
                  }
                }}
                placeholder="Tulis ide... @role #kategori (opsional)"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hidden sm:inline">Enter ↵</span>
            </div>

            {dropdown === 'role' && (() => {
              const last = input.split(' ').pop() || '';
              const q = last.startsWith('@') ? last.slice(1).toLowerCase() : '';
              const opts = allRoles.filter(r => !q || r.toLowerCase().startsWith(q));
              return opts.length > 0 ? (
                <div className="mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {opts.map(r => (
                    <button key={r} onClick={() => insertTag(`@${r.toLowerCase()}`)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 active:bg-slate-600 transition-colors">
                      @{r.toLowerCase()}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
            {dropdown === 'cat' && (() => {
              const last = input.split(' ').pop() || '';
              const q = last.startsWith('#') ? last.slice(1).toLowerCase() : '';
              const opts = IDEA_CATEGORIES.filter(c => !q || c.toLowerCase().replace(' ', '').startsWith(q));
              return opts.length > 0 ? (
                <div className="mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  {opts.map(c => (
                    <button key={c} onClick={() => insertTag(`#${c.toLowerCase().replace(' ', '')}`)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 active:bg-slate-600 transition-colors">
                      #{c.toLowerCase()}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}

            <div className="flex gap-2 mt-3">
              <Button onClick={handleSave} disabled={saving || !input.trim()} className="flex-1">
                {saved ? '✅ Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2 text-center">Tag @role dan #kategori bersifat opsional</p>
          </div>
        </div>
      )}
    </>
  );
}
