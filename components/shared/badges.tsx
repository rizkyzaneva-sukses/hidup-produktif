'use client';
import { ROLE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RoleBadgeProps { role: string; size?: 'sm' | 'md'; }
export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) {
    return (
      <span className={cn('inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full font-medium bg-slate-500/20 text-slate-300', size === 'sm' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')}>
        {role}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full font-medium', cfg.bgSoft, cfg.text, size === 'sm' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')}>
      <span>{cfg.emoji}</span>
      <span className="hidden sm:inline">{role}</span>
    </span>
  );
}

interface WorkTypeBadgeProps { type: string; size?: 'sm' | 'md'; }
export function WorkTypeBadge({ type, size = 'sm' }: WorkTypeBadgeProps) {
  const colors: Record<string, string> = {
    'Deep Work': 'bg-red-500/20 text-red-300',
    'Admin': 'bg-yellow-500/20 text-yellow-300',
    'Shallow': 'bg-green-500/20 text-green-300',
  };
  const icons: Record<string, string> = {
    'Deep Work': '🔴',
    'Admin': '🟡',
    'Shallow': '🟢',
  };
  return (
    <span className={cn('inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full font-medium', colors[type] || 'bg-slate-500/20 text-slate-300', size === 'sm' ? 'text-[10px] sm:text-xs' : 'text-xs sm:text-sm')}>
      <span className="sm:hidden">{icons[type] || '⚪'}</span>
      <span className="hidden sm:inline">{type}</span>
      <span className="sm:hidden">{type === 'Deep Work' ? 'DW' : type}</span>
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { Tinggi: 'bg-red-400', Sedang: 'bg-yellow-400', Rendah: 'bg-green-400' };
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', colors[priority] || 'bg-slate-400')} />
      <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">{priority}</span>
    </span>
  );
}
