import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Compass, PlayCircle, RotateCcw, Sparkles } from 'lucide-react';
import { tourAnchor, useTour } from '@vfp/guided-tour';
import { cx } from '../ui/kit';

export function HelpMenu() {
  const { tours, isSeen, start, reset } = useTour();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);

  const groups = tours.reduce<Record<string, typeof tours[number][]>>((acc, t) => {
    const g = t.group ?? '其他';
    (acc[g] ??= []).push(t);
    return acc;
  }, {});
  const seen = tours.filter((t) => isSeen(t.id)).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        {...tourAnchor('help-menu')}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-gradient-to-b from-slate-900 to-slate-800 px-3 text-[13px] font-medium text-white shadow-[0_6px_16px_-8px_rgba(15,23,42,.8)] hover:from-slate-800"
      >
        <Sparkles className="size-4 text-teal-300" />
        导览
        <span className="rounded-md bg-white/15 px-1.5 text-[11px] tabular-nums">
          {seen}/{tours.length}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(2,6,23,.4)] ring-1 ring-slate-200 animate-[pop_.2s_ease]">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-900 px-5 py-4 text-white">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <Compass className="size-4 text-teal-300" />
              第一次用？跟着导览走
            </div>
            <div className="mt-1 text-xs text-slate-300">每个页面首次打开会自动出现，也可以在这里随时重看。</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${(seen / Math.max(1, tours.length)) * 100}%` }} />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2 scroll-thin">
            {Object.entries(groups).map(([g, list]) => (
              <div key={g} className="py-1">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g}</div>
                {list.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      start(t.id);
                    }}
                    className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    {isSeen(t.id) ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <PlayCircle className="mt-0.5 size-4 shrink-0 text-teal-500" />
                    )}
                    <div className="min-w-0">
                      <div className={cx('text-[13px] font-medium', isSeen(t.id) ? 'text-slate-600' : 'text-slate-900')}>{t.title}</div>
                      <div className="text-xs text-slate-500">{t.summary}</div>
                    </div>
                    <span className="ml-auto self-center text-[11px] text-slate-400 opacity-0 group-hover:opacity-100">{t.steps.length} 步</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="size-3.5" /> 重置导览进度（再次首访会自动弹出）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
