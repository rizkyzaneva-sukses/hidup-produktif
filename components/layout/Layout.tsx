'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QuickCaptureFAB } from '@/components/shared/QuickCaptureFAB';
import { getEffectiveKey, matchesKeyCombo } from '@/lib/shortcuts';

// ─── Navigation data ──────────────────────────────────────────────────────────

/** Top 5 pinned items — always visible */
const NAV_MAIN = [
  { href: '/', icon: '🏠', label: 'Beranda' },
  { href: '/sprint', icon: '🎯', label: 'Sprint' },
  { href: '/tasks', icon: '✅', label: 'Tasks' },
  { href: '/habits', icon: '🌟', label: 'Habits' },
  { href: '/focus', icon: '⏱', label: 'Focus' },
];

/** Icon-only quick actions — displayed as a horizontal row of small buttons */
const QUICK_ACTIONS = [
  { href: '/ideas', icon: '💡', label: 'Ide' },
  { href: '/goals', icon: '📥', label: 'Goals' },
  { href: '/mood', icon: '😊', label: 'Mood' },
];

/** Kelola section — collapsible, default collapsed */
const NAV_KELOLA = [
  { href: '/projects', icon: '🗂', label: 'Proyek' },
  { href: '/learning', icon: '📚', label: 'Belajar' },
  { href: '/reminders', icon: '🔔', label: 'Reminders' },
  { href: '/subscriptions', icon: '💳', label: 'Langganan' },
  { href: '/laporan', icon: '📊', label: 'Laporan' },
];

/** Peran section — collapsible, default collapsed */
const ROLES_NAV = [
  { href: '/role/CEO', icon: '💼', label: 'CEO' },
  { href: '/role/Suami', icon: '💑', label: 'Suami' },
  { href: '/role/Ayah', icon: '👨‍👧‍👦', label: 'Ayah' },
  { href: '/role/Anak', icon: '🤲', label: 'Anak' },
  { href: '/role/Pelajar', icon: '📖', label: 'Pelajar' },
];

/** Mobile bottom nav — 5 items */
const BOTTOM_NAV = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/sprint', icon: '🎯', label: 'Sprint' },
  { href: '/tasks', icon: '✅', label: 'Tasks' },
  { href: '/habits', icon: '🌟', label: 'Habits' },
  { href: '/more', icon: '☰', label: 'Lainnya' },
];

// ─── Shared style helpers ──────────────────────────────────────────────────────

function navItemClass(pathname: string, href: string, collapsed: boolean, mobile: boolean) {
  return cn(
    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150',
    pathname === href
      ? 'bg-blue-600/20 text-blue-300 font-medium shadow-sm shadow-blue-500/10'
      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
    collapsed && !mobile ? 'justify-center px-2' : '',
  );
}

function sectionLabel(children: React.ReactNode, collapsed: boolean, mobile: boolean) {
  if (collapsed && !mobile) return null;
  return (
    <div className="pb-1 px-3 pt-1">
      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
        {children}
      </p>
    </div>
  );
}

function separator() {
  return <div className="my-1.5 mx-2 border-t border-slate-700/40" />;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kelolaOpen, setKelolaOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  if (pathname === '/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  // Restore collapsed state from localStorage
  useEffect(() => {
    const val = localStorage.getItem('sidebar-collapsed');
    if (val === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const NAV_MAP: Record<string, string> = {
      'nav-home': '/', 'nav-sprint': '/sprint', 'nav-tasks': '/tasks',
      'nav-habits': '/habits', 'nav-focus': '/focus', 'nav-goals': '/goals',
      'nav-mood': '/mood', 'nav-ideas': '/ideas',
      'nav-projects': '/projects', 'nav-learning': '/learning',
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

  // Highlight "More" on mobile when current path isn't in the 4 main bottom items
  const isMoreActive =
    !BOTTOM_NAV.slice(0, 4).some(item => pathname === item.href) && pathname !== '/';

  // ── Sidebar (shared between desktop & mobile overlay) ──────────────────────

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => {
    const isCollapsed = collapsed && !mobile;

    return (
      <div className={cn(
        'flex flex-col h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50',
        mobile ? 'w-72' : collapsed ? 'w-16' : 'w-60',
        'transition-all duration-200',
      )}>
        {/* ─── Logo ─────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center gap-2 p-3 border-b border-slate-700/50',
          isCollapsed && 'justify-center',
        )}>
          <span className="text-xl flex-shrink-0">🕌</span>
          {(!isCollapsed) && (
            <div className="flex-1 min-w-0">
              <span className="font-bold text-white text-sm leading-tight block">Hidup Produktif</span>
              <span className="text-amber-400 text-[11px] font-semibold">Berkah</span>
            </div>
          )}
          {!mobile && (
            <button
              onClick={toggleCollapse}
              className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '→' : '←'}
            </button>
          )}
          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* ─── Scrollable nav area ──────────────────────────── */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">

          {/* === Top 5 pinned items === */}
          {NAV_MAIN.map(item => (
            <Link key={item.href} href={item.href}
              className={navItemClass(pathname, item.href, collapsed, mobile)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}

          {/* === Quick Actions — icon-only row === */}
          {isCollapsed ? (
            /* Collapsed: stack vertically like mini buttons */
            <div className="flex flex-col items-center gap-1 pt-1 pb-0.5">
              {QUICK_ACTIONS.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-lg text-base transition-all duration-150',
                    pathname === item.href
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-300',
                  )}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          ) : (
            /* Expanded: horizontal row of icon buttons */
            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5">
              {QUICK_ACTIONS.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg text-lg transition-all duration-150',
                    pathname === item.href
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-500 hover:bg-slate-800/80 hover:text-slate-300',
                  )}
                  title={item.label}
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          )}

          {/* ── Divider ── */}
          {separator()}

          {/* === Kelola section (collapsible) === */}
          {isCollapsed ? (
            /* Collapsed: single icon, click to expand sidebar */
            <div className="flex justify-center py-0.5">
              <button
                onClick={toggleCollapse}
                className="text-slate-600 hover:text-slate-300 transition-colors"
                title="Kelola — expand sidebar to access"
              >
                <span className="text-base">🗂</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setKelolaOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-xs">▾</span>
                <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wider">
                  Kelola
                </span>
                <span className={cn(
                  'text-[10px] transition-transform duration-200',
                  kelolaOpen ? 'rotate-0' : '-rotate-90',
                )}>
                  ▸
                </span>
              </button>
              {kelolaOpen && NAV_KELOLA.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    navItemClass(pathname, item.href, false, mobile),
                    'pl-7',
                  )}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}

          {/* ── Divider ── */}
          {separator()}

          {/* === Peran section (collapsible) === */}
          {isCollapsed ? (
            <div className="flex justify-center py-0.5">
              <button
                onClick={toggleCollapse}
                className="text-slate-600 hover:text-slate-300 transition-colors"
                title="Peran — expand sidebar to access"
              >
                <span className="text-base">👑</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setRolesOpen(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-xs">▾</span>
                <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wider">
                  Peran
                </span>
                <span className={cn(
                  'text-[10px] transition-transform duration-200',
                  rolesOpen ? 'rotate-0' : '-rotate-90',
                )}>
                  ▸
                </span>
              </button>
              {rolesOpen && ROLES_NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    navItemClass(pathname, item.href, false, mobile),
                    'pl-7',
                  )}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* ─── Bottom pinned items ──────────────────────────── */}
        <div className="p-2 border-t border-slate-700/50 space-y-0.5">
          {/* Panduan */}
          <Link href="/panduan"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150',
              pathname === '/panduan'
                ? 'bg-blue-600/20 text-blue-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              isCollapsed && 'justify-center px-2',
            )}
            title={isCollapsed ? 'Panduan' : undefined}
          >
            <span className="text-base flex-shrink-0">📖</span>
            {!isCollapsed && <span>Panduan</span>}
          </Link>

          {/* Settings */}
          <Link href="/settings"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150',
              pathname === '/settings'
                ? 'bg-blue-600/20 text-blue-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              isCollapsed && 'justify-center px-2',
            )}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <span className="text-base flex-shrink-0">⚙️</span>
            {!isCollapsed && <span>Settings</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150',
              'text-slate-400 hover:bg-red-500/10 hover:text-red-400',
              isCollapsed && 'justify-center px-2',
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile/Tablet sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex-shrink-0 animate-slide-in">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header for tablet */}
        <div className="hidden md:flex lg:hidden items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="text-sm font-semibold text-white">Hidup Produktif Berkah</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom">
        <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 px-2 py-1">
          <div className="flex items-center justify-around">
            {BOTTOM_NAV.map(item => {
              const isActive = item.href === '/more'
                ? isMoreActive
                : pathname === item.href;

              if (item.href === '/more') {
                return (
                  <button
                    key={item.href}
                    onClick={() => setMobileOpen(true)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]',
                      isActive ? 'text-blue-400' : 'text-slate-500',
                    )}
                  >
                    <span className="text-lg mb-0.5">{item.icon}</span>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]',
                    isActive ? 'text-blue-400' : 'text-slate-500 active:text-slate-300',
                  )}
                >
                  <span className={cn('text-lg mb-0.5', isActive && 'scale-110')}>
                    {item.icon}
                  </span>
                  <span className={cn('text-[10px] font-medium', isActive && 'text-blue-400')}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-5 h-0.5 bg-blue-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <QuickCaptureFAB />
    </div>
  );
}
