import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useStore, type Toast } from '../store/StoreProvider';
import { cx } from '../ui/kit';

const ICON = { ok: CheckCircle2, info: Info, warn: AlertTriangle, bad: XCircle } as const;
const COLOR = { ok: 'text-emerald-400', info: 'text-sky-400', warn: 'text-amber-400', bad: 'text-rose-400' } as const;

export function ToastHost() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useStore();
  useEffect(() => {
    const t = window.setTimeout(() => dismissToast(toast.id), 4200);
    return () => window.clearTimeout(t);
  }, [toast.id, dismissToast]);
  const Icon = ICON[toast.tone];
  return (
    <div className="pointer-events-auto flex min-w-[320px] max-w-[520px] items-start gap-3 rounded-2xl bg-slate-900/95 px-4 py-3 text-white shadow-[0_20px_50px_-12px_rgba(2,6,23,.6)] ring-1 ring-white/10 backdrop-blur animate-[toast_.3s_cubic-bezier(.2,.9,.25,1.1)]">
      <Icon className={cx('mt-0.5 size-[18px] shrink-0', COLOR[toast.tone])} />
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{toast.title}</div>
        {toast.detail && <div className="mt-0.5 text-xs text-slate-400">{toast.detail}</div>}
      </div>
    </div>
  );
}
