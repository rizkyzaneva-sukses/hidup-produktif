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
    const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20',
      outline: 'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white',
      ghost: 'text-slate-400 hover:bg-slate-800 hover:text-white',
      destructive: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
      secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs sm:text-sm',
      md: 'h-9 sm:h-10 px-4 text-sm',
      lg: 'h-10 sm:h-11 px-6 text-sm sm:text-base',
      icon: 'h-9 w-9 sm:h-10 sm:w-10'
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = 'Button';

// ── Input ────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('w-full h-10 sm:h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Input.displayName = 'Input';

// ── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => (
    <select ref={ref} className={cn('h-10 sm:h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-colors', className)} {...props}>
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
    default: 'bg-blue-500/20 text-blue-300',
    success: 'bg-green-500/20 text-green-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
    danger: 'bg-red-500/20 text-red-300',
    purple: 'bg-purple-500/20 text-purple-300',
    pink: 'bg-pink-500/20 text-pink-300',
    amber: 'bg-amber-500/20 text-amber-300',
    slate: 'bg-slate-500/20 text-slate-300',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium', variants[variant], className)} {...props} />;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm transition-colors', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5 pb-2', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5 pt-2', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm sm:text-base font-semibold text-white', className)} {...props} />;
}

// ── Dialog ────────────────────────────────────────────────────────────────────
interface DialogProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string; }
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full sm:max-w-lg bg-slate-900 border border-slate-700 shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto',
        'rounded-t-2xl sm:rounded-2xl',
        className
      )}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
            <h2 className="text-sm sm:text-base font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2 rounded-lg hover:bg-slate-800 transition-colors">✕</button>
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
    <div className={cn('w-full h-1.5 sm:h-2 bg-slate-700 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin', className)} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center px-4">
      <div className="text-4xl sm:text-5xl mb-3">{icon}</div>
      <p className="text-white font-medium text-sm sm:text-base">{title}</p>
      {desc && <p className="text-slate-400 text-xs sm:text-sm mt-1">{desc}</p>}
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
        className={cn('relative w-11 h-6 rounded-full transition-colors', checked ? 'bg-blue-600' : 'bg-slate-700')}
      >
        <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </div>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </label>
  );
}
