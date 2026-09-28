import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, CalendarClock, CircleCheckBig, DoorOpen, LogOut, ShieldAlert, TriangleAlert, UserRoundX, Users, type LucideIcon,
} from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { useVisitContexts, type VisitContext } from '../../store/selectors';
import { hm, humanMinutes, toSec } from '../../domain/time';
import { lateMinutes } from '../../domain/visitEngine';
import type { ExceptionItem } from '../../domain/types';
import { Avatar, Badge, Button, Card, CardHeader, Meter, Segmented, cx } from '../../ui/kit';
import { PhaseBadge, ProjectChip, StepChain, StepWhere, WindowBadge } from '../../ui/visit';
import { toneSolid } from '../../ui/tone';

type Filter = 'all' | 'screening' | 'followup' | 'attention';

export function OverviewPage() {
  const { data, now } = useStore();
  const ctxs = useVisitContexts();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const live = ctxs.filter((c) => c.phase === 'onsite' || c.phase === 'ready_checkout' || c.phase === 'paused');
  const needsAttention = (c: VisitContext) =>
    c.phase === 'paused' || c.openExceptions.length > 0 || c.steps.some((s) => s.view === 'hold' || s.view === 'failed');

  const rows = useMemo(() => {
    const f = live.filter((c) =>
      filter === 'all' ? true : filter === 'screening' ? c.visit.visitPoint === 'V1' : filter === 'followup' ? c.visit.visitPoint !== 'V1' : needsAttention(c),
    );
    return f.sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a)) || (a.visit.checkin?.at ?? '').localeCompare(b.visit.checkin?.at ?? ''));
  }, [live, filter]);

  const openEx = data.exceptions.filter((e) => e.status === 'open');
  const kpis: { label: string; value: number; sub: string; icon: LucideIcon; tone: string; to: string }[] = [
    { label: '今日预约', value: ctxs.filter((c) => c.phase !== 'cancelled').length, sub: `${data.projects.length} 个项目`, icon: CalendarClock, tone: 'from-slate-700 to-slate-900', to: '/arrivals' },
    { label: '已到场', value: ctxs.filter((c) => c.visit.checkin).length, sub: '含已签出', icon: DoorOpen, tone: 'from-sky-500 to-blue-600', to: '/arrivals' },
    { label: '场内进行中', value: live.length, sub: `${ctxs.filter((c) => c.phase === 'ready_checkout').length} 人待签出`, icon: Users, tone: 'from-teal-500 to-emerald-600', to: '/stations' },
    { label: '已签出', value: ctxs.filter((c) => c.phase === 'checked_out').length, sub: '今日完成', icon: LogOut, tone: 'from-emerald-500 to-lime-600', to: '/arrivals' },
    { label: '迟到 / 缺席', value: ctxs.filter((c) => c.phase === 'late' || c.phase === 'no_show').length, sub: `${ctxs.filter((c) => c.phase === 'upcoming').length} 人待到`, icon: UserRoundX, tone: 'from-amber-500 to-orange-600', to: '/arrivals' },
    { label: '待处理异常', value: openEx.length, sub: `${openEx.filter((e) => e.severity === 'high').length} 条高优先级`, icon: ShieldAlert, tone: 'from-rose-500 to-pink-600', to: '/exceptions' },
  ];

  const hour = Math.floor(now / 3600);
  const greet = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div className="animate-[rise_.35s_ease]">
      <div className="flex flex-wrap items-end gap-4 pb-6">
        <div>
          <div className="text-[13px] text-slate-500">
            {data.site.today.replaceAll('-', ' / ')} · {data.site.weekday}
          </div>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-slate-900">
            {greet}，{data.site.operator.name}
            <span className="ml-2 text-slate-400">现场 {live.length} 人，{openEx.filter((e) => e.severity === 'high').length} 件急事等你</span>
          </h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => navigate('/stations')}>打开工位</Button>
          <Button variant="primary" onClick={() => navigate('/arrivals')}>
            <DoorOpen className="size-4" />
            签到受试者
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3" {...tourAnchor('kpis')}>
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => navigate(k.to)}
            className="group relative overflow-hidden rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/70 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgba(16,24,40,.3)]"
          >
            <div className={cx('grid size-8 place-items-center rounded-lg bg-gradient-to-br text-white shadow-sm', k.tone)}>
              <k.icon className="size-4" strokeWidth={2} />
            </div>
            <div className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">{k.value}</div>
            <div className="mt-1.5 text-[13px] font-medium text-slate-700">{k.label}</div>
            <div className="text-[11.5px] text-slate-400">{k.sub}</div>
            <ArrowUpRight className="absolute right-3 top-3 size-4 text-slate-300 opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_380px] gap-5">
        <Card {...tourAnchor('live-board')}>
          <CardHeader
            title="现场实时动线"
            sub="每一行是一位在场受试者 · 圆点 = 今日导检的每一步"
            right={
              <Segmented<Filter>
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: '全部', count: live.length },
                  { value: 'screening', label: '筛选', count: live.filter((c) => c.visit.visitPoint === 'V1').length },
                  { value: 'followup', label: '复访', count: live.filter((c) => c.visit.visitPoint !== 'V1').length },
                  { value: 'attention', label: '需关注', count: live.filter(needsAttention).length },
                ]}
              />
            }
          />
          <div className="grid grid-cols-[minmax(170px,1.2fr)_minmax(180px,1.1fr)_minmax(200px,1.4fr)_88px_84px] gap-3 border-y border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <div>受试者</div>
            <div>当前所在</div>
            <div>导检进度</div>
            <div>在场</div>
            <div className="text-right">状态</div>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((c) => (
              <button
                key={c.visit.id}
                type="button"
                onClick={() => navigate(`/visits/${c.visit.id}`)}
                className="grid w-full grid-cols-[minmax(170px,1.2fr)_minmax(180px,1.1fr)_minmax(200px,1.4fr)_88px_84px] items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50/80"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.subject.name} hue={c.subject.hue} size={34} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium text-slate-900">{c.subject.name}</span>
                      <span className="rounded bg-slate-900 px-1 font-mono text-[10.5px] font-medium text-white">{c.visit.checkin?.no}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <ProjectChip project={c.project} visitPoint={c.visit.visitPoint} />
                      {c.subject.rd && <span className="font-mono text-[11px] text-slate-400">{c.subject.rd}</span>}
                    </div>
                  </div>
                </div>
                <StepWhere step={c.current} />
                <div>
                  <StepChain steps={c.steps} />
                  <div className="mt-1.5 text-[11px] text-slate-400 tabular-nums">
                    {c.done} / {c.total} 步
                  </div>
                </div>
                <div className="text-[13px] tabular-nums text-slate-600">{c.visit.checkin ? humanMinutes((now - toSec(c.visit.checkin.at)) / 60) : '—'}</div>
                <div className="flex flex-col items-end gap-1">
                  <PhaseBadge phase={c.phase} />
                  {c.openExceptions.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-600">
                      <TriangleAlert className="size-3" />
                      {c.openExceptions.length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <AlertRail items={openEx} />
          <StationLoad ctxs={ctxs} />
          <Upcoming ctxs={ctxs} />
        </div>
      </div>
    </div>
  );
}

const SEV = { high: 'bad', medium: 'warn', low: 'info' } as const;

function AlertRail({ items }: { items: ExceptionItem[] }) {
  const { data, now } = useStore();
  const navigate = useNavigate();
  const sorted = [...items].sort((a, b) => ['high', 'medium', 'low'].indexOf(a.severity) - ['high', 'medium', 'low'].indexOf(b.severity));
  return (
    <Card {...tourAnchor('alerts')}>
      <CardHeader
        title="需要你处理"
        sub="按紧急程度排序 · 含处理时限"
        icon={<TriangleAlert className="size-4 text-rose-500" />}
        right={
          <Button size="sm" variant="ghost" onClick={() => navigate('/exceptions')}>
            全部
          </Button>
        }
      />
      <div className="space-y-2 px-3 pb-3">
        {sorted.slice(0, 5).map((e) => {
          const subj = data.subjects.find((s) => s.id === e.subjectId);
          const left = Math.round((toSec(e.raisedAt) + e.slaMinutes * 60 - now) / 60);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => navigate(e.visitId ? `/visits/${e.visitId}` : '/exceptions')}
              className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left ring-1 ring-transparent transition hover:bg-slate-50 hover:ring-slate-200"
            >
              <span className={cx('mt-1 size-2 shrink-0 rounded-full', e.severity === 'high' ? 'bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,.15)]' : e.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-500')} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-snug text-slate-800">{e.title}</div>
                <div className="mt-0.5 text-[11.5px] text-slate-500">
                  {subj?.name} · {e.raisedAt} · {e.raisedBy}
                </div>
              </div>
              <Badge intent={left < 0 ? 'bad' : SEV[e.severity]}>{left < 0 ? `超时 ${-left} 分` : left > 120 ? '今日内' : `剩 ${left} 分`}</Badge>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function StationLoad({ ctxs }: { ctxs: VisitContext[] }) {
  const { data } = useStore();
  const navigate = useNavigate();
  const onsite = ctxs.filter((c) => c.phase === 'onsite');
  return (
    <Card {...tourAnchor('station-load')}>
      <CardHeader title="工位负载" sub="正在做 / 容量 · 排队人数" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pb-5">
        {data.stations.map((st) => {
          const here = onsite.filter((c) => c.current?.station.id === st.id);
          const active = here.filter((c) => c.current?.view === 'active').length;
          const waiting = here.length - active;
          const full = active >= st.capacity;
          return (
            <button key={st.id} type="button" onClick={() => navigate(`/stations/${st.id}`)} className="text-left">
              <div className="flex items-center gap-1.5 text-[12.5px]">
                <span className={cx('size-1.5 rounded-full', toneSolid[st.tone])} />
                <span className="truncate font-medium text-slate-700">{st.name}</span>
                <span className="ml-auto tabular-nums text-slate-400">
                  {active}/{st.capacity}
                </span>
              </div>
              <Meter className="mt-1.5" value={active} max={st.capacity} intent={full ? 'bad' : active / st.capacity > 0.6 ? 'warn' : 'brand'} />
              <div className="mt-1 text-[11px] text-slate-400">{waiting > 0 ? `${waiting} 人排队` : '空闲'}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Upcoming({ ctxs }: { ctxs: VisitContext[] }) {
  const { now } = useStore();
  const navigate = useNavigate();
  const list = ctxs
    .filter((c) => c.phase === 'upcoming' || c.phase === 'late')
    .sort((a, b) => a.visit.slot.start.localeCompare(b.visit.slot.start));
  return (
    <Card {...tourAnchor('upcoming')}>
      <CardHeader title="即将到访" sub={`此刻 ${hm(now)} 之后`} icon={<CircleCheckBig className="size-4" />} />
      <div className="px-3 pb-3">
        {list.map((c) => (
          <button key={c.visit.id} type="button" onClick={() => navigate('/arrivals')} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50">
            <div className={cx('w-12 text-center font-mono text-[13px] font-semibold tabular-nums', c.phase === 'late' ? 'text-amber-600' : 'text-slate-700')}>{c.visit.slot.start}</div>
            <Avatar name={c.subject.name} hue={c.subject.hue} size={28} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-slate-800">{c.subject.name}</div>
              <ProjectChip project={c.project} visitPoint={c.visit.visitPoint} />
            </div>
            {c.phase === 'late' ? <Badge intent="warn">迟到 {lateMinutes(c.visit, now)} 分</Badge> : <WindowBadge info={c.window} />}
          </button>
        ))}
      </div>
    </Card>
  );
}
