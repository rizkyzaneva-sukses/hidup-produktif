'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-500',
      outline: 'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white',
      ghost: 'text-slate-400 hover:bg-slate-800 hover:text-white',
      destructive: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
      secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-9 w-9',
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = 'Button';

// ── Input ────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Input.displayName = 'Input';

// ── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent resize-none disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select ref={ref} className={cn('h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-colors', className)} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
);
Select.displayName = 'Select';

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'pink' | 'amber' | 'slate';
}
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-blue-500/15 text-blue-300',
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-yellow-500/15 text-yellow-300',
    danger: 'bg-red-500/15 text-red-300',
    purple: 'bg-purple-500/15 text-purple-300',
    pink: 'bg-pink-500/15 text-pink-300',
    amber: 'bg-amber-500/15 text-amber-300',
    slate: 'bg-slate-500/15 text-slate-300',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)} {...props} />;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-slate-800 bg-slate-900/50', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5 pb-2', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5 pt-2', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold text-white', className)} {...props} />;
}

// ── Dialog ────────────────────────────────────────────────────────────────────
interface DialogProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string; }
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full sm:max-w-lg bg-slate-900 border border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto',
        'rounded-t-xl sm:rounded-lg',
        className
      )}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md rounded-t-xl">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 -mr-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 1l12 12M13 1L1 13"/></svg>
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
interface ProgressBarProps { value: number; max: number; className?: string; colorClass?: string; }
export function ProgressBar({ value, max, className, colorClass = 'bg-blue-500' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('w-full h-1.5 bg-slate-800 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin', className)} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p className="text-white font-medium text-sm">{title}</p>
      {desc && <p className="text-slate-500 text-sm mt-1">{desc}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; }
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={cn('relative w-10 h-5 rounded-full transition-colors', checked ? 'bg-blue-600' : 'bg-slate-700')}
      >
        <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </div>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
