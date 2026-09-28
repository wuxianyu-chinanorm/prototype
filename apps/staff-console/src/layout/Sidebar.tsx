import { NavLink } from 'react-router-dom';
import {
  DoorOpen, LayoutDashboard, Route as RouteIcon, Scale, TriangleAlert, Users, Workflow, type LucideIcon,
} from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../store/StoreProvider';
import { useVisitContexts } from '../store/selectors';
import { gateStep } from '../domain/visitEngine';
import { Avatar, cx } from '../ui/kit';

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  urgent?: boolean;
}

export function Sidebar() {
  const { data } = useStore();
  const ctxs = useVisitContexts();
  const arriving = ctxs.filter((c) => c.phase === 'upcoming' || c.phase === 'late').length;
  const late = ctxs.some((c) => c.phase === 'late');
  const pendingGate = ctxs.filter((c) => {
    const g = gateStep(c.steps);
    return g?.view === 'ready' && c.phase === 'onsite';
  }).length;
  const openEx = data.exceptions.filter((e) => e.status === 'open');

  const today: Item[] = [
    { to: '/', label: '今日总览', icon: LayoutDashboard },
    { to: '/arrivals', label: '到访签到', icon: DoorOpen, badge: arriving, urgent: late },
    { to: '/stations', label: '工位执行', icon: Workflow },
    { to: '/eligibility', label: '入排判定', icon: Scale, badge: pendingGate, urgent: pendingGate > 0 },
    { to: '/exceptions', label: '异常中心', icon: TriangleAlert, badge: openEx.length, urgent: openEx.some((e) => e.severity === 'high') },
  ];
  const prep: Item[] = [
    { to: '/guides', label: '导检编排', icon: RouteIcon },
    { to: '/subjects', label: '项目与受试者', icon: Users },
  ];

  return (
    <aside className="relative flex w-[248px] shrink-0 flex-col bg-[#0a1120] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_260px_at_0%_0%,rgba(20,184,166,.18),transparent),radial-gradient(300px_300px_at_100%_100%,rgba(99,102,241,.14),transparent)]" />
      <div className="relative flex items-center gap-3 px-5 pt-5 pb-6">
        <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 shadow-[0_8px_20px_-6px_rgba(20,184,166,.7)]">
          <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="6" r="2" />
            <circle cx="19" cy="18" r="2" />
            <path d="M7 12h4l6-6M11 12l6 6" />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight text-white">访视中枢</div>
          <div className="text-[11px] text-slate-400">现场控制塔 · 原型</div>
        </div>
      </div>

      <nav className="relative flex-1 space-y-6 px-3" {...tourAnchor('nav')}>
        <NavGroup title="今天" items={today} />
        <NavGroup title="开工前准备" items={prep} />
      </nav>

      <div className="relative m-3 rounded-xl bg-white/[.04] p-3 ring-1 ring-white/[.06]">
        <div className="flex items-center gap-2.5">
          <Avatar name={data.site.operator.name} hue={data.site.operator.hue} size={32} />
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white">{data.site.operator.name}</div>
            <div className="truncate text-[11px] text-slate-400">
              {data.site.operator.role} · {data.site.site.short}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <div className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[.14em] text-slate-500">{title}</div>
      <div className="space-y-0.5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              cx(
                'group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-colors',
                isActive ? 'bg-white/[.08] text-white' : 'text-slate-400 hover:bg-white/[.04] hover:text-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,.8)]" />}
                <it.icon className={cx('size-[18px]', isActive ? 'text-teal-300' : 'text-slate-500 group-hover:text-slate-300')} strokeWidth={1.9} />
                {it.label}
                {!!it.badge && (
                  <span
                    className={cx(
                      'ml-auto min-w-5 rounded-md px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5',
                      it.urgent ? 'bg-rose-500/90 text-white' : 'bg-white/10 text-slate-300',
                    )}
                  >
                    {it.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
