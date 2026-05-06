export type ShortcutGroup = 'global' | 'nav' | 'form';

export interface ShortcutDef {
  id: string;
  label: string;
  description: string;
  defaultKey: string;
  group: ShortcutGroup;
  editable: boolean;
}

export const SHORTCUTS: ShortcutDef[] = [
  // Global
  { id: 'parkir-ide', label: 'Parkir Ide', description: 'Buka popup input ide cepat', defaultKey: 'Ctrl+Q', group: 'global', editable: true },
  { id: 'search', label: 'Pencarian', description: 'Buka halaman pencarian', defaultKey: 'Ctrl+Shift+F', group: 'global', editable: true },
  // Form
  { id: 'submit', label: 'Simpan Form', description: 'Submit/simpan form yang sedang aktif', defaultKey: 'Ctrl+Enter', group: 'form', editable: false },
  // Navigation
  { id: 'nav-home', label: 'Beranda', description: 'Pergi ke Beranda', defaultKey: 'Alt+1', group: 'nav', editable: true },
  { id: 'nav-sprint', label: 'Daily Sprint', description: 'Pergi ke Daily Sprint', defaultKey: 'Alt+2', group: 'nav', editable: true },
  { id: 'nav-tasks', label: 'Tasks', description: 'Pergi ke Tasks', defaultKey: 'Alt+3', group: 'nav', editable: true },
  { id: 'nav-habits', label: 'Habits', description: 'Pergi ke Habits', defaultKey: 'Alt+4', group: 'nav', editable: true },
  { id: 'nav-focus', label: 'Focus Mode', description: 'Pergi ke Focus Mode', defaultKey: 'Alt+5', group: 'nav', editable: true },
  { id: 'nav-ideas', label: 'Parkir Ide (halaman)', description: 'Pergi ke halaman Parkir Ide', defaultKey: 'Alt+6', group: 'nav', editable: true },
  { id: 'nav-projects', label: 'Proyek', description: 'Pergi ke Proyek', defaultKey: 'Alt+7', group: 'nav', editable: true },
  { id: 'nav-learning', label: 'Log Belajar', description: 'Pergi ke Log Belajar', defaultKey: 'Alt+8', group: 'nav', editable: true },
];

const STORAGE_KEY = 'app-shortcuts';

export function loadCustomShortcuts(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

export function saveCustomShortcut(id: string, key: string): void {
  const current = loadCustomShortcuts();
  current[id] = key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function resetShortcut(id: string): void {
  const current = loadCustomShortcuts();
  delete current[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getEffectiveKey(id: string): string {
  const custom = loadCustomShortcuts();
  const def = SHORTCUTS.find(s => s.id === id);
  return custom[id] || def?.defaultKey || '';
}

export function matchesKeyCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split('+');
  const key = parts[parts.length - 1];
  const ctrl = parts.includes('Ctrl');
  const shift = parts.includes('Shift');
  const alt = parts.includes('Alt');
  return e.ctrlKey === ctrl && e.shiftKey === shift && e.altKey === alt && e.key === key;
}

export function formatSyntheticKey(e: React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  const k = e.key;
  if (k !== 'Control' && k !== 'Shift' && k !== 'Alt' && k !== 'Meta') parts.push(k);
  return parts.join('+');
}
