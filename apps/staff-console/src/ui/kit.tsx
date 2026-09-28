import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { intentDot, intentSoft, type Intent } from './tone';

export const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-medium transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 whitespace-nowrap';
const btnVariant: Record<BtnVariant, string> = {
  primary:
    'text-white bg-gradient-to-b from-teal-500 to-teal-600 shadow-[0_1px_0_rgba(255,255,255,.25)_inset,0_6px_16px_-6px_rgba(13,148,136,.7)] hover:from-teal-400 hover:to-teal-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'text-white bg-gradient-to-b from-rose-500 to-rose-600 shadow-[0_6px_16px_-6px_rgba(225,29,72,.6)] hover:from-rose-400',
  dark: 'text-white bg-slate-900 hover:bg-slate-800 shadow-[0_6px_16px_-8px_rgba(15,23,42,.8)]',
};
const btnSize = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-[15px]' } as const;

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: keyof typeof btnSize }) {
  return <button type="button" className={cx(btnBase, btnVariant[variant], btnSize[size], className)} {...rest} />;
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(16,24,40,.04),0_12px_32px_-20px_rgba(16,24,40,.18)]',
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ title, sub, right, icon }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      {icon && <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600">{icon}</div>}
      <div className="min-w-0">
        <div className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Badge({ intent = 'neutral', dot, className, children }: { intent?: Intent; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset whitespace-nowrap', intentSoft[intent], className)}>
      {dot && <span className={cx('size-1.5 rounded-full', intentDot[intent])} />}
      {children}
    </span>
  );
}

export function Avatar({ name, hue, size = 36, ring }: { name: string; hue: number; size?: number; ring?: boolean }) {
  const initial = name.slice(-2);
  return (
    <div
      className={cx('grid shrink-0 place-items-center rounded-full font-semibold text-white', ring && 'ring-2 ring-white')}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background: `linear-gradient(140deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 65% 48%))`,
      }}
    >
      {initial}
    </div>
  );
}

export function Meter({ value, max, intent = 'brand', className }: { value: number; max: number; intent?: Intent; className?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cx('h-full rounded-full transition-all duration-500', intentDot[intent])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, max, size = 44, stroke = 5, color = '#14b8a6', track = '#e2e8f0', children }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: {
  value: T; options: { value: T; label: ReactNode; count?: number }[]; onChange(v: T): void; size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100/80 p-1 ring-1 ring-inset ring-slate-200/60">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
            o.value === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={cx('rounded-md px-1.5 text-[11px] tabular-nums', o.value === value ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-600')}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {sub && <div className="max-w-xs text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, right, anchor }: { title: string; sub?: ReactNode; right?: ReactNode; anchor?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap items-end gap-4 pb-5" {...anchor}>
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-slate-600">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11.5px] text-slate-400">{hint}</div>}
    </label>
  );
}

export const inputCls =
  'h-9 w-full rounded-[10px] bg-white px-3 text-sm text-slate-800 ring-1 ring-slate-200 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/60';
