import { createContext, useContext, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tourAnchor } from '@vfp/guided-tour';

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

/** 手机屏幕根节点：底部弹层、通知横幅都挂在这里，而不是整个浏览器窗口 */
export const ScreenHostContext = createContext<HTMLElement | null>(null);

export function Page({ children, tabbed, className }: { children: ReactNode; tabbed?: boolean; className?: string }) {
  return (
    <div className={cx('no-scrollbar absolute inset-0 overflow-y-auto bg-[#f5f6f8]', className)}>
      <div className={cx('min-h-full pt-[54px]', tabbed ? 'pb-[104px]' : 'pb-10')} style={{ animation: 'fade .25s ease both' }}>
        {children}
      </div>
    </div>
  );
}

export function LargeTitle({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-5 pb-3 pt-3">
      <div>
        {sub && <div className="text-[13px] font-medium text-slate-500">{sub}</div>}
        <h1 className="text-[30px] font-bold leading-tight tracking-tight text-slate-900">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function NavBar({ title, back = true, right }: { title: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="glass sticky top-0 z-20 -mt-[54px] flex h-[98px] items-end border-b border-black/5 px-2 pb-2.5">
      <div className="flex w-20">
        {back && (
          <button
            onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
            className="flex items-center text-[16px] font-medium text-brand-600 active:opacity-50"
          >
            <ChevronLeft size={26} strokeWidth={2.2} />
            返回
          </button>
        )}
      </div>
      <div className="flex-1 truncate pb-0.5 text-center text-[16px] font-semibold text-slate-900">{title}</div>
      <div className="flex w-20 justify-end pr-2">{right}</div>
    </div>
  );
}

export function Card({ children, className, anchor, onClick }: { children: ReactNode; className?: string; anchor?: string; onClick?: () => void }) {
  return (
    <div
      {...(anchor ? tourAnchor(anchor) : {})}
      onClick={onClick}
      className={cx('rounded-[22px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]', onClick && 'cursor-pointer active:scale-[0.99] transition', className)}
    >
      {children}
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('px-4 pt-5', className)}>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type BtnTone = 'primary' | 'dark' | 'soft' | 'ghost' | 'danger' | 'white';
const btnTone: Record<BtnTone, string> = {
  primary: 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_8px_20px_-8px_rgba(13,135,122,0.7)]',
  dark: 'bg-slate-900 text-white',
  soft: 'bg-brand-50 text-brand-700',
  ghost: 'bg-slate-100 text-slate-700',
  danger: 'bg-rose-50 text-rose-600',
  white: 'bg-white text-slate-900 shadow-sm',
};

export function Btn({
  tone = 'primary',
  size = 'lg',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone; size?: 'lg' | 'md' | 'sm' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100',
        size === 'lg' && 'h-[52px] rounded-2xl px-5 text-[16px]',
        size === 'md' && 'h-10 rounded-xl px-4 text-[14px]',
        size === 'sm' && 'h-8 rounded-full px-3 text-[12.5px]',
        btnTone[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', className)}>{children}</span>;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const host = useContext(ScreenHostContext);
  if (!open || !host) return null;
  return createPortal(
    <div className="absolute inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/35" style={{ animation: 'fade .2s ease both' }} onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[82%] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-9 pt-2.5 no-scrollbar"
        style={{ animation: 'sheet .32s cubic-bezier(.2,.8,.2,1) both' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[18px] font-bold text-slate-900">{title}</div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500">
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    host,
  );
}

export function Row({ icon, title, sub, right, onClick, last }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <div onClick={onClick} className={cx('flex items-center gap-3 px-4 py-3', onClick && 'cursor-pointer active:bg-slate-50')}>
      {icon}
      <div className={cx('flex min-w-0 flex-1 items-center gap-3 self-stretch', !last && 'border-b border-slate-100 pb-3 -mb-3')}>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium text-slate-900">{title}</div>
          {sub && <div className="mt-0.5 text-[12.5px] text-slate-500">{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', className)}>{children}</div>;
}

export function Ring({ value, size = 170, stroke = 12, children, color = '#14a896', track = 'rgba(255,255,255,0.18)' }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string; track?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
