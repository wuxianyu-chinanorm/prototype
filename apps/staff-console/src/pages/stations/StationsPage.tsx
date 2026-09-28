import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hourglass, Inbox, Timer, UserRound } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { useVisitContexts, type VisitContext } from '../../store/selectors';
import { humanMinutes, mmss } from '../../domain/time';
import { waitingSince } from '../../domain/visitEngine';
import { Avatar, Badge, Card, CardHeader, Empty, PageHeader, Ring, cx } from '../../ui/kit';
import { ProjectChip, VIEW } from '../../ui/visit';
import { toneSolid } from '../../ui/tone';
import { StepIcon } from '../../ui/icons';
import { ExecPanel } from './ExecPanel';

export function StationsPage() {
  const { stationId } = useParams();
  const { data, now } = useStore();
  const ctxs = useVisitContexts();
  const navigate = useNavigate();
  const onsite = ctxs.filter((c) => c.phase === 'onsite');
  const at = (id: string) => onsite.filter((c) => c.current?.station.id === id);

  const busiest = [...data.stations].sort((a, b) => at(b.id).length - at(a.id).length)[0];
  const station = data.stations.find((s) => s.id === stationId) ?? busiest ?? data.stations[0]!;
  const here = at(station.id);
  const active = here.filter((c) => c.current?.view === 'active');
  const queue = here
    .filter((c) => c.current?.view !== 'active')
    .sort((a, b) => Number(b.current?.view === 'ready') - Number(a.current?.view === 'ready'));

  const [selected, setSelected] = useState<string | null>(null);
  const sel = here.find((c) => c.visit.id === selected) ?? queue.find((c) => c.current?.view === 'ready') ?? active[0] ?? queue[0];

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader title="工位执行" sub="完成态只在工位写入 · 门禁检查全绿才能开始" />

      <div className="-mx-1 mb-5 flex gap-2.5 overflow-x-auto px-1 pb-1 scroll-thin" {...tourAnchor('station-picker')}>
        {data.stations.map((st) => {
          const list = at(st.id);
          const act = list.filter((c) => c.current?.view === 'active').length;
          const wait = list.length - act;
          const on = st.id === station.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                setSelected(null);
                navigate(`/stations/${st.id}`);
              }}
              className={cx(
                'relative flex w-[168px] shrink-0 items-center gap-3 rounded-2xl p-3 text-left ring-1 transition',
                on ? 'bg-slate-900 text-white ring-slate-900 shadow-[0_16px_30px_-16px_rgba(15,23,42,.8)]' : 'bg-white ring-slate-200/80 hover:ring-slate-300',
              )}
            >
              <Ring value={act} max={st.capacity} size={40} stroke={4} color={act >= st.capacity ? '#f43f5e' : '#14b8a6'} track={on ? 'rgba(255,255,255,.15)' : '#e2e8f0'}>
                <span className={cx('text-[11px] font-semibold tabular-nums', on ? 'text-white' : 'text-slate-700')}>
                  {act}/{st.capacity}
                </span>
              </Ring>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[13px] font-medium">
                  <span className={cx('size-1.5 shrink-0 rounded-full', toneSolid[st.tone])} />
                  <span className="truncate">{st.name}</span>
                </div>
                <div className={cx('truncate text-[11px]', on ? 'text-slate-400' : 'text-slate-400')}>{st.room}</div>
              </div>
              {wait > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-500 text-[10.5px] font-bold text-white ring-2 ring-white">{wait}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[320px_minmax(0,1fr)_280px] gap-5">
        <Card {...tourAnchor('station-queue')}>
          <CardHeader title="待服务队列" sub={`${station.name} · ${queue.length} 人`} icon={<Inbox className="size-4" />} />
          <div className="space-y-1.5 px-3 pb-3">
            {queue.length === 0 && <Empty icon={<Inbox className="size-5" />} title="没有人在等" sub="有人轮到这里时会自动出现" />}
            {queue.map((c) => (
              <QueueItem key={c.visit.id} c={c} now={now} selected={sel?.visit.id === c.visit.id} onClick={() => setSelected(c.visit.id)} />
            ))}
          </div>
        </Card>

        <div {...tourAnchor('station-exec')}>
          {sel?.current ? (
            <ExecPanel key={`${sel.visit.id}-${sel.current.key}`} ctx={sel} step={sel.current} station={station} activeCount={active.length} />
          ) : (
            <Card>
              <Empty icon={<UserRound className="size-5" />} title="选择左侧一位受试者开始" sub="或者等待下一位到达" />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card {...tourAnchor('station-active')}>
            <CardHeader title="正在进行" sub={`${active.length} / ${station.capacity} 容量`} icon={<Timer className="size-4" />} />
            <div className="space-y-1.5 px-3 pb-3">
              {active.length === 0 && <div className="px-2 pb-2 text-xs text-slate-400">空闲</div>}
              {active.map((c) => {
                const s = c.current!;
                const el = (s.elapsedSec ?? 0) / 60;
                const over = !s.template.isBalance && el > s.minutes;
                return (
                  <button key={c.visit.id} type="button" onClick={() => setSelected(c.visit.id)} className={cx('flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50', sel?.visit.id === c.visit.id && 'bg-slate-50 ring-1 ring-slate-200')}>
                    <Avatar name={c.subject.name} hue={c.subject.hue} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-slate-800">{c.subject.name}</div>
                      <div className="text-[11px] text-slate-500">{s.template.name}</div>
                    </div>
                    {s.balanceRemainSec !== undefined ? (
                      <span className="font-mono text-[12px] font-semibold tabular-nums text-teal-600">{mmss(s.balanceRemainSec)}</span>
                    ) : (
                      <span className={cx('font-mono text-[12px] tabular-nums', over ? 'font-semibold text-rose-600' : 'text-slate-500')}>{Math.floor(el)}′/{s.minutes}′</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="本工位" sub={station.room} />
            <div className="space-y-2 px-5 pb-5 text-[13px]">
              <div className="flex justify-between text-slate-600">
                <span>值班</span>
                <span className="font-medium text-slate-900">{station.staff.join('、')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>容量</span>
                <span className="font-medium text-slate-900">{station.capacity} 人同时</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>今日承接步骤</span>
                <span className="font-medium text-slate-900">{data.templates.filter((t) => t.stationId === station.id).map((t) => t.short).join(' · ')}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QueueItem({ c, now, selected, onClick }: { c: VisitContext; now: number; selected: boolean; onClick(): void }) {
  const s = c.current!;
  const since = waitingSince(c.visit, c.steps, s);
  const ready = s.view === 'ready';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-start gap-3 rounded-xl p-2.5 text-left ring-1 transition',
        selected ? 'bg-teal-50/70 ring-teal-300' : 'ring-transparent hover:bg-slate-50 hover:ring-slate-200',
        !ready && 'opacity-80',
      )}
    >
      <Avatar name={c.subject.name} hue={c.subject.hue} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-medium text-slate-900">{c.subject.name}</span>
          <span className="rounded bg-slate-900 px-1 font-mono text-[10px] text-white">{c.visit.checkin?.no}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <StepIcon name={s.template.icon} className="size-3" />
          {s.template.name}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <ProjectChip project={c.project} visitPoint={c.visit.visitPoint} />
        </div>
        {!ready && (
          <div className={cx('mt-1.5 flex items-center gap-1 text-[11.5px]', s.view === 'hold' ? 'text-amber-700' : 'text-slate-500')}>
            <Hourglass className="size-3" />
            {s.view === 'hold' ? s.run?.note ?? '已挂起' : s.blockers[0]?.text}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge intent={VIEW[s.view].intent}>{VIEW[s.view].label}</Badge>
        {ready && since !== undefined && <span className="text-[11px] tabular-nums text-slate-400">已等 {humanMinutes((now - since) / 60)}</span>}
      </div>
    </button>
  );
}
