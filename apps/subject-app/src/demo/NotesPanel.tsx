import { Lightbulb, PlayCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { routeMatches, useTour } from '@vfp/guided-tour';
import { useApp } from '../store/AppStore';

/** 产品批注：随手机当前页面切换，解释这一屏背后的业务规则 */
export function NotesPanel() {
  const { pathname } = useLocation();
  const { content } = useApp();
  const tour = useTour();
  const note = content.annotations.find((a) => a.route === pathname);
  const pageTour = tour.tours.find((t) => t.trigger.type === 'firstVisit' && routeMatches(t.trigger.route, pathname));

  return (
    <aside className="flex h-[calc(100%-40px)] w-[300px] shrink-0 flex-col justify-center">
      <div className="rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur" key={pathname} style={{ animation: 'rise .3s ease both' }}>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
          <Lightbulb size={13} />
          产品说明
          <span className="ml-auto font-mono normal-case tracking-normal text-slate-400">{pathname}</span>
        </div>
        <div className="mt-2 text-[19px] font-bold tracking-tight text-slate-900">{note?.title ?? '—'}</div>
        <ul className="mt-3 space-y-2.5">
          {(note?.points ?? ['这一屏暂无批注。']).map((p) => (
            <li key={p} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {p}
            </li>
          ))}
        </ul>
        {pageTour && (
          <button onClick={() => tour.start(pageTour.id)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-[12.5px] font-semibold text-white">
            <PlayCircle size={14} />
            播放本屏导览「{pageTour.title}」
          </button>
        )}
      </div>
    </aside>
  );
}
