'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QuickCaptureFAB } from '@/components/shared/QuickCaptureFAB';

const NAV = [
  { href: '/', icon: '🏠', label: 'Beranda' },
  { href: '/sprint', icon: '🎯', label: 'Daily Sprint' },
  { href: '/tasks', icon: '✅', label: 'Tasks' },
  { href: '/habits', icon: '🌟', label: 'Habits' },
  { href: '/focus', icon: '⏱', label: 'Focus Mode' },
  { href: '/ideas', icon: '💡', label: 'Parkir Ide' },
  { href: '/projects', icon: '🗂', label: 'Proyek' },
  { href: '/learning', icon: '📚', label: 'Log Belajar' },
  { href: '/reminders', icon: '🔔', label: 'Reminders' },
  { href: '/subscriptions', icon: '💳', label: 'Subscriptions' },
  { href: '/laporan', icon: '📊', label: 'Laporan & Review' },
];

const ROLES_NAV = [
  { href: '/role/CEO', icon: '💼', label: 'CEO' },
  { href: '/role/Suami', icon: '💑', label: 'Suami' },
  { href: '/role/Ayah', icon: '👨‍👧‍👦', label: 'Ayah' },
  { href: '/role/Anak', icon: '🤲', label: 'Anak' },
  { href: '/role/Pelajar', icon: '📖', label: 'Pelajar' },
];

// Bottom nav items for mobile (most used features)
const BOTTOM_NAV = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/sprint', icon: '🎯', label: 'Sprint' },
  { href: '/tasks', icon: '✅', label: 'Tasks' },
  { href: '/habits', icon: '🌟', label: 'Habits' },
  { href: '/more', icon: '☰', label: 'Lainnya' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem('sidebar-collapsed');
    if (val === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.location.href = '/search';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Check if current path matches any non-bottom-nav item (for "more" highlight)
  const isMoreActive = !BOTTOM_NAV.slice(0, 4).some(item => pathname === item.href) && pathname !== '/';

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      'flex flex-col h-full bg-slate-900/95 backdrop-blur-md border-r border-slate-700/50',
      mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64',
      'transition-all duration-200'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-slate-700/50', collapsed && !mobile ? 'justify-center' : '')}>
        <span className="text-2xl flex-shrink-0">🕌</span>
        {(!collapsed || mobile) && (
          <div className="flex-1 min-w-0">
            <span className="font-bold text-white text-sm leading-tight block">Hidup Produktif</span>
            <span className="text-amber-400 text-xs font-semibold">Berkah</span>
          </div>
        )}
        {!mobile && (
          <button onClick={toggleCollapse} className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            {collapsed ? '→' : '←'}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
              pathname === item.href
                ? 'bg-blue-600/20 text-blue-300 font-medium shadow-sm shadow-blue-500/10'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              collapsed && !mobile ? 'justify-center px-2' : ''
            )}
            title={collapsed && !mobile ? item.label : undefined}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Roles section */}
        {(!collapsed || mobile) && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Peran</p>
          </div>
        )}
        {collapsed && !mobile && <div className="my-2 mx-2 border-t border-slate-700/50" />}
        {ROLES_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
              pathname === item.href
                ? 'bg-blue-600/20 text-blue-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              collapsed && !mobile ? 'justify-center px-2' : ''
            )}
            title={collapsed && !mobile ? item.label : undefined}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-slate-700/50 space-y-0.5">
        <Link href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors',
            pathname === '/settings' ? 'bg-blue-600/20 text-blue-300' : '',
            collapsed && !mobile ? 'justify-center px-2' : ''
          )}
        >
          <span className="text-lg">⚙️</span>
          {(!collapsed || mobile) && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors',
            collapsed && !mobile ? 'justify-center px-2' : ''
          )}
          title={collapsed && !mobile ? 'Logout' : undefined}
        >
          <span className="text-lg">🚪</span>
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile/Tablet sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex-shrink-0 animate-slide-in">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header for tablet */}
        <div className="hidden md:flex lg:hidden items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
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
                      isActive ? 'text-blue-400' : 'text-slate-500'
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
                    isActive
                      ? 'text-blue-400'
                      : 'text-slate-500 active:text-slate-300'
                  )}
                >
                  <span className={cn('text-lg mb-0.5', isActive && 'scale-110')}>{item.icon}</span>
                  <span className={cn('text-[10px] font-medium', isActive && 'text-blue-400')}>{item.label}</span>
                  {isActive && <span className="absolute -bottom-0.5 w-5 h-0.5 bg-blue-400 rounded-full" />}
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
