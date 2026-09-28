import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './kit';

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
}

export function Drawer({ open, onClose, title, sub, width = 560, footer, children }: {
  open: boolean; onClose(): void; title: ReactNode; sub?: ReactNode; width?: number; footer?: ReactNode; children: ReactNode;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] animate-[fade_.2s_ease]" onClick={onClose} />
      <aside
        className="absolute inset-y-2 right-2 flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(2,6,23,.45)] ring-1 ring-slate-200 animate-[slidein_.28s_cubic-bezier(.2,.8,.2,1)]"
        style={{ width }}
      >
        <header className="flex items-start gap-3 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-semibold tracking-tight text-slate-900">{title}</div>
            {sub && <div className="mt-0.5 text-[13px] text-slate-500">{sub}</div>}
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, sub, footer, children, width = 480 }: {
  open: boolean; onClose(): void; title: ReactNode; sub?: ReactNode; footer?: ReactNode; children: ReactNode; width?: number;
}) {
  useEsc(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center p-6">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px] animate-[fade_.2s_ease]" onClick={onClose} />
      <div
        className={cx('relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-20px_rgba(2,6,23,.5)] ring-1 ring-slate-200 animate-[pop_.25s_cubic-bezier(.2,.9,.25,1.1)]')}
        style={{ maxWidth: width }}
      >
        <div className="px-6 pt-5 pb-4">
          <div className="text-[17px] font-semibold tracking-tight text-slate-900">{title}</div>
          {sub && <div className="mt-1 text-[13px] text-slate-500">{sub}</div>}
        </div>
        <div className="px-6 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
