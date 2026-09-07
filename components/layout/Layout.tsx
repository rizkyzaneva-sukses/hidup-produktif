'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QuickCaptureFAB } from '@/components/shared/QuickCaptureFAB';
import { getEffectiveKey, matchesKeyCombo } from '@/lib/shortcuts';
import {
  Home, Target, Flame, Timer,
  FolderKanban, BookOpen, Bell, CreditCard, BarChart3,
  BookMarked, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, X,
  LayoutGrid,
} from 'lucide-react';

const NAV_MAIN = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/aktivitas', icon: Target, label: 'Aktivitas' },
  { href: '/rutinitas', icon: Flame, label: 'Rutinitas' },
  { href: '/focus', icon: Timer, label: 'Focus' },
  { href: '/quran', icon: BookOpen, label: 'Quran' },
];
const NAV_KELOLA = [
  { href: '/inbox', icon: Bell, label: 'Inbox' },
  { href: '/proyek-belajar', icon: FolderKanban, label: 'Proyek & Belajar' },
  { href: '/keuangan', icon: CreditCard, label: 'Keuangan' },
];

const BOTTOM_NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/aktivitas', icon: Target, label: 'Aktivitas' },
  { href: '/rutinitas', icon: Flame, label: 'Rutinitas' },
  { href: '/focus', icon: Timer, label: 'Focus' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  if (pathname === '/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  useEffect(() => {
    const val = localStorage.getItem('sidebar-collapsed');
    if (val === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    const NAV_MAP: Record<string, string> = {
      'nav-home': '/', 'nav-aktivitas': '/aktivitas', 'nav-rutinitas': '/rutinitas',
      'nav-focus': '/focus', 'nav-quran': '/quran',
      'nav-inbox': '/inbox', 'nav-projects': '/proyek-belajar', 'nav-learning': '/proyek-belajar',
      'nav-keuangan': '/keuangan',
    };
    const handler = (e: KeyboardEvent) => {
      if (matchesKeyCombo(e, getEffectiveKey('search'))) {
        e.preventDefault(); window.location.href = '/search'; return;
      }
      for (const [id, href] of Object.entries(NAV_MAP)) {
        if (matchesKeyCombo(e, getEffectiveKey(id))) {
          e.preventDefault(); window.location.href = href; return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isMoreActive = !BOTTOM_NAV.some(item => pathname === item.href);

  // ── Desktop/Tablet sidebar ──────────────────────────────────────────────────

  const Sidebar = () => (
    <aside className={cn(
      'flex flex-col h-full bg-slate-950 border-r border-slate-800/80 transition-all duration-200',
      collapsed ? 'w-[48px]' : 'w-[200px]',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 border-b border-slate-800/80 shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4',
      )}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm text-white tracking-tight">Hidup Produktif</span>
            <span className="text-amber-400 text-[11px] font-medium ml-1.5">Berkah</span>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="text-slate-500 hover:text-white p-1.5 rounded-md hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 no-scrollbar">
        {/* Main nav */}
        <div className="space-y-0.5">
          {NAV_MAIN.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-2.5 h-9 rounded-lg text-[13px] font-medium transition-colors',
                  collapsed ? 'justify-center' : 'px-2.5',
                  active
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
        <div className="my-1.5 mx-1 border-t border-slate-800/60" />

        {/* Kelola section — always visible on desktop */}
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">Kelola</div>
          )}
          {NAV_KELOLA.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-2.5 h-9 rounded-lg text-[13px] font-medium transition-colors',
                  collapsed ? 'justify-center' : 'px-2.5',
                  active ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                )}
                title={collapsed ? item.label : undefined}>
                <Icon size={18} className="shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

      </nav>

      {/* Bottom actions */}
      <div className="border-t border-slate-800/80 p-2 space-y-0.5 shrink-0">
        <Link href="/panduan"
          className={cn(
            'flex items-center gap-2.5 h-9 rounded-lg text-[13px] transition-colors',
            collapsed ? 'justify-center' : 'px-2.5',
            pathname === '/panduan' ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
          )}
          title={collapsed ? 'Panduan' : undefined}
        >
          <BookMarked size={18} className="shrink-0" />
          {!collapsed && <span>Panduan</span>}
        </Link>
        <Link href="/settings"
          className={cn(
            'flex items-center gap-2.5 h-9 rounded-lg text-[13px] transition-colors',
            collapsed ? 'justify-center' : 'px-2.5',
            pathname === '/settings' ? 'bg-blue-500/10 text-blue-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2.5 h-9 rounded-lg text-[13px] transition-colors text-slate-500 hover:text-red-400 hover:bg-red-500/5',
            collapsed ? 'justify-center' : 'px-2.5',
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      {/* Desktop/Tablet sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom">
        <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80">
          <div className="flex items-center h-14 max-w-lg mx-auto">
            {BOTTOM_NAV.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
                    active ? 'text-blue-400' : 'text-slate-500',
                  )}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                  <span className="text-xs font-medium">{item.label}</span>
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />}
                </Link>
              );
            })}
            {/* More button */}
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
                isMoreActive || moreOpen ? 'text-blue-400' : 'text-slate-500',
              )}
            >
              <LayoutGrid size={20} strokeWidth={1.6} />
              <span className="text-xs font-medium">More</span>
              {isMoreActive && !moreOpen && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile "More" bottom sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-xl border-t border-slate-800 animate-slide-up safe-bottom max-h-[85vh] overflow-y-auto">
            {/* Handle + close */}
            <div className="sticky top-0 bg-slate-900 rounded-t-xl z-10">
              <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <div className="flex justify-center flex-1">
                  <div className="w-10 h-1 bg-slate-700 rounded-full" />
                </div>
                <button onClick={() => setMoreOpen(false)} className="text-slate-500 hover:text-white p-1 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Kelola list */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Kelola</p>
              <div className="space-y-0.5">
                {NAV_KELOLA.map(item => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        'flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium transition-colors',
                        active ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 active:bg-slate-800',
                      )}>
                      <Icon size={18} className={cn('shrink-0', active ? 'text-blue-400' : 'text-slate-500')} strokeWidth={1.6} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Settings & logout */}
            <div className="px-5 py-4 pb-8 space-y-0.5">
              <Link href="/panduan"
                className={cn(
                  'flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/panduan' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 active:bg-slate-800',
                )}>
                <BookMarked size={18} className="text-slate-500 shrink-0" />
                <span>Panduan</span>
              </Link>
              <Link href="/settings"
                className={cn(
                  'flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/settings' ? 'bg-blue-500/10 text-blue-400' : 'text-slate-300 active:bg-slate-800',
                )}>
                <Settings size={18} className="text-slate-500 shrink-0" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 active:bg-red-500/5 transition-colors"
              >
                <LogOut size={18} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickCaptureFAB />
    </div>
  );
}
