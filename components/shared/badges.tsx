'use client';
import { ROLE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RoleBadgeProps { role: string; size?: 'sm' | 'md'; }
export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) {
    return (
      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md font-medium bg-slate-500/15 text-slate-300', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {role}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium', cfg.bgSoft, cfg.text, size === 'sm' ? 'text-xs' : 'text-sm')}>
      <span className="text-xs">{cfg.emoji}</span>
      <span>{role}</span>
    </span>
  );
}

interface WorkTypeBadgeProps { type: string; size?: 'sm' | 'md'; }
export function WorkTypeBadge({ type, size = 'sm' }: WorkTypeBadgeProps) {
  const colors: Record<string, string> = {
    'Deep Work': 'bg-red-500/15 text-red-300',
    'Admin': 'bg-yellow-500/15 text-yellow-300',
    'Shallow': 'bg-emerald-500/15 text-emerald-300',
  };
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-md font-medium', colors[type] || 'bg-slate-500/15 text-slate-300', size === 'sm' ? 'text-xs' : 'text-sm')}>
      {type}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { Tinggi: 'bg-red-400', Sedang: 'bg-yellow-400', Rendah: 'bg-emerald-400' };
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', colors[priority] || 'bg-slate-400')} />
      <span className="text-xs text-slate-500">{priority}</span>
    </span>
  );
}
