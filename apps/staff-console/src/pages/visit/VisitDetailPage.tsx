import { Fragment, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, CircleDot, CircleX, Clock3, Hourglass, LogOut, Pause, ShieldCheck, TriangleAlert } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { useVisitContext, type VisitContext } from '../../store/selectors';
import { md, mmss, toSec } from '../../domain/time';
import { DIM_LABEL, gateDimensions, type DimState, type ResolvedStep } from '../../domain/visitEngine';
import { Avatar, Badge, Button, Card, CardHeader, Empty, cx } from '../../ui/kit';
import { PhaseBadge, ProjectChip, StepChain, VIEW, WindowBadge } from '../../ui/visit';
import { StepIcon } from '../../ui/icons';
import { CheckoutDrawer } from './CheckoutDrawer';

export function VisitDetailPage() {
  const { visitId } = useParams();
  const ctx = useVisitContext(visitId);
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(false);

  if (!ctx) return <Empty icon={<TriangleAlert className="size-5" />} title="找不到这次访视" />;
  const { visit, subject, project } = ctx;
  const canCheckout = ['onsite', 'ready_checkout', 'paused'].includes(ctx.phase);

  return (
    <div className="animate-[rise_.35s_ease]">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" /> 返回
      </button>

      <Card className="relative overflow-hidden" {...tourAnchor('visit-header')}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_100%_0%,rgba(20,184,166,.10),transparent)]" />
        <div className="relative flex flex-wrap items-center gap-5 p-6">
          <Avatar name={subject.name} hue={subject.hue} size={60} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold tracking-tight text-slate-900">{subject.name}</h1>
              {visit.checkin && <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[12px] text-white">签到号 {visit.checkin.no}</span>}
              <PhaseBadge phase={ctx.phase} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
              <ProjectChip project={project} visitPoint={visit.visitPoint} />
              <span>{project.name}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono">{subject.sc}</span>
              {subject.rd && <span className="font-mono text-teal-700">随机号 {subject.rd}</span>}
              <span className="text-slate-300">·</span>
              <span>
                {subject.gender} {subject.age} 岁 · {subject.skinType}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {ctx.current && ctx.phase === 'onsite' && (
              <Button onClick={() => navigate(`/stations/${ctx.current!.station.id}`)}>
                去 {ctx.current.station.name} <ArrowRight className="size-4" />
              </Button>
            )}
            <span {...tourAnchor('checkout-btn')}>
              <Button variant={ctx.phase === 'ready_checkout' ? 'primary' : 'secondary'} disabled={!canCheckout} onClick={() => setCheckout(true)}>
                <LogOut className="size-4" />
                {ctx.phase === 'checked_out' ? '已签出' : '签出'}
              </Button>
            </span>
          </div>
        </div>
        <div className="relative grid grid-cols-5 divide-x divide-slate-100 border-t border-slate-100 text-[13px]">
          <Meta label="① 访视窗" value={visit.window.start === visit.window.end ? md(visit.window.start) : `${md(visit.window.start)} – ${md(visit.window.end)}`} extra={<WindowBadge info={ctx.window} />} />
          <Meta label="② 预约时段" value={`${visit.slot.start} – ${visit.slot.end}`} />
          <Meta label="③ 实际到达" value={visit.checkin?.at ?? '—'} extra={visit.checkin && <span className="text-xs text-slate-500">核验：{visit.checkin.verifiedBy}</span>} />
          <Meta label="导检版本" value={`V${visit.guideVersion}`} extra={<span className="text-xs text-slate-500">签到时锁定</span>} />
          <Meta label="进度" value={`${ctx.done} / ${ctx.total}`} extra={<StepChain steps={ctx.steps} size="sm" />} />
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_380px] gap-5">
        <Card {...tourAnchor('visit-timeline')}>
          <CardHeader title="今日导检动线" sub="顺序来自已发布版本 · 完成态由各工位写入，这里只读" />
          <div className="px-5 pb-5">
            {ctx.steps.map((s, i) => (
              <Fragment key={s.key}>
                {s.template.isGateAnchor && (
                  <div className="relative my-2 flex items-center gap-3 py-1" {...tourAnchor('gate-divider')}>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-300 to-rose-300" />
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-[11.5px] font-semibold text-rose-700 ring-1 ring-rose-200">▲ 入组判定锚点 · 以上为筛选证据，以下需入组后执行</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-300 to-rose-300" />
                  </div>
                )}
                <TimelineRow step={s} last={i === ctx.steps.length - 1} />
              </Fragment>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <GateCard ctx={ctx} />
          <ExceptionsCard ctx={ctx} />
          <Card {...tourAnchor('visit-log')}>
            <CardHeader title="操作留痕" sub="谁、什么时候、做了什么" />
            <div className="px-5 pb-5">
              {[...visit.log].reverse().map((l, i) => (
                <div key={i} className="relative flex gap-3 pb-3.5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={cx('mt-1.5 size-2 rounded-full', l.tone === 'ok' ? 'bg-emerald-500' : l.tone === 'bad' ? 'bg-rose-500' : l.tone === 'warn' ? 'bg-amber-500' : 'bg-slate-300')} />
                    <span className="mt-1 w-px flex-1 bg-slate-100" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-slate-700">{l.text}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {l.at} · {l.actor}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {checkout && <CheckoutDrawer ctx={ctx} onClose={() => setCheckout(false)} />}
    </div>
  );
}

function Meta({ label, value, extra }: { label: string; value: string; extra?: ReactNode }) {
  return (
    <div className="px-6 py-3.5">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className="mt-0.5 font-mono text-[15px] font-semibold tabular-nums text-slate-900">{value}</div>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  );
}

const ROW_ICON = {
  done: <CircleCheck className="size-[18px] text-white" />,
  active: <CircleDot className="size-[18px] text-white" />,
  ready: <ArrowRight className="size-4 text-teal-600" />,
  blocked: <Clock3 className="size-4 text-slate-400" />,
  failed: <CircleX className="size-[18px] text-white" />,
  hold: <Pause className="size-4 text-white" />,
  waived: <span className="text-[11px] font-semibold text-slate-400">免</span>,
};
const ROW_BG = {
  done: 'bg-emerald-500',
  active: 'bg-teal-500 shadow-[0_0_0_6px_rgba(20,184,166,.18)]',
  ready: 'bg-teal-50 ring-2 ring-teal-400',
  blocked: 'bg-slate-100',
  failed: 'bg-rose-500',
  hold: 'bg-amber-500',
  waived: 'bg-slate-100',
};

function TimelineRow({ step, last }: { step: ResolvedStep; last: boolean }) {
  const r = step.run;
  const actual = r?.start && r.end ? Math.round((toSec(r.end) - toSec(r.start)) / 60) : undefined;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cx('grid size-8 shrink-0 place-items-center rounded-full', ROW_BG[step.view])}>{ROW_ICON[step.view]}</div>
        {!last && <div className={cx('w-[2px] flex-1', step.view === 'done' ? 'bg-emerald-200' : 'bg-slate-100')} />}
      </div>
      <div className={cx('mb-3 flex min-w-0 flex-1 items-start gap-4 rounded-xl px-4 py-3 ring-1', step.view === 'active' ? 'bg-teal-50/50 ring-teal-200' : step.view === 'hold' ? 'bg-amber-50/60 ring-amber-200' : step.view === 'failed' ? 'bg-rose-50/60 ring-rose-200' : 'ring-slate-100')}>
        <StepIcon name={step.template.icon} className="mt-0.5 size-[18px] shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cx('text-[14px] font-medium', step.view === 'waived' ? 'text-slate-400 line-through' : 'text-slate-900')}>{step.template.name}</span>
            {step.template.gateDim && step.beforeGate && <Badge intent="violet">门禁 · {DIM_LABEL[step.template.gateDim]}</Badge>}
            {step.template.requiresEnrollment && <Badge intent="neutral">需入组</Badge>}
            {step.template.performer === 'subject' && <Badge intent="info">受试者自助</Badge>}
          </div>
          <div className="mt-0.5 text-[12px] text-slate-500">
            {step.station.name} · 标准 {step.minutes} 分钟
            {r?.operator && ` · ${r.operator}`}
          </div>
          {(r?.note || r?.values || step.view === 'blocked' || r?.override) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
              {r?.values &&
                Object.entries(r.values).map(([k, v]) => (
                  <span key={k} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                    {k}={v}
                  </span>
                ))}
              {r?.note && <span className="text-slate-600">{r.note}</span>}
              {r?.override && <span className="text-amber-700">督导 {r.override.by} 批准提前：{r.override.reason}</span>}
              {step.view === 'blocked' && step.blockers[0] && (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Hourglass className="size-3" />
                  {step.blockers[0].text}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Badge intent={VIEW[step.view].intent}>{VIEW[step.view].label}</Badge>
          <div className="mt-1 font-mono text-[11.5px] tabular-nums text-slate-400">
            {step.balanceRemainSec !== undefined ? (
              <span className="font-semibold text-teal-600">剩 {mmss(step.balanceRemainSec)}</span>
            ) : r?.start ? (
              `${r.start}${r.end ? `–${r.end}` : ''}${actual !== undefined ? ` · ${actual}′` : ''}`
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const DIM_STYLE: Record<DimState, { cls: string; label: string }> = {
  pass: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: '通过' },
  fail: { cls: 'bg-rose-50 text-rose-700 ring-rose-200', label: '失败' },
  hold: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', label: '挂起' },
  pending: { cls: 'bg-slate-50 text-slate-500 ring-slate-200', label: '待完成' },
};

function GateCard({ ctx }: { ctx: VisitContext }) {
  const dims = gateDimensions(ctx.steps);
  const gate = ctx.steps.find((s) => s.template.isGateAnchor);
  return (
    <Card {...tourAnchor('gate-dims')}>
      <CardHeader title="入组门禁" sub={gate ? '锚点前各维度 · 任一步失败即该维度失败' : '复访没有入组判定'} icon={<ShieldCheck className="size-4" />} />
      <div className="px-5 pb-5">
        {gate ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {dims.map((d) => (
                <div key={d.dim} className={cx('rounded-xl px-3 py-2.5 ring-1', DIM_STYLE[d.state].cls)}>
                  <div className="text-[12px] font-medium">{DIM_LABEL[d.dim]}</div>
                  <div className="mt-0.5 text-[11px] opacity-80">{DIM_STYLE[d.state].label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
              <span className="text-slate-600">判定结果</span>
              {gate.run?.status === 'done' ? (
                gate.run.result === 'pass' ? (
                  <Badge intent="ok">入组 · {gate.run.values?.rd}</Badge>
                ) : (
                  <Badge intent="bad">筛败</Badge>
                )
              ) : gate.view === 'ready' ? (
                <Link to={`/eligibility/${ctx.visit.id}`} className="text-[13px] font-medium text-teal-700 hover:underline">
                  证据已齐 · 去判定 →
                </Link>
              ) : (
                <span className="text-slate-400">证据未齐</span>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600">
            已于 {ctx.subject.visits.find((v) => v.code === 'V1')?.date ?? '—'} 入组，随机号 <b className="font-mono">{ctx.subject.rd}</b>。本次按复访导检执行。
          </div>
        )}
      </div>
    </Card>
  );
}

function ExceptionsCard({ ctx }: { ctx: VisitContext }) {
  const { data } = useStore();
  const list = data.exceptions.filter((e) => e.visitId === ctx.visit.id);
  if (list.length === 0) return null;
  return (
    <Card>
      <CardHeader title="本次访视异常" icon={<TriangleAlert className="size-4 text-amber-500" />} />
      <div className="space-y-2 px-4 pb-4">
        {list.map((e) => (
          <Link key={e.id} to="/exceptions" className="block rounded-xl p-3 ring-1 ring-slate-200 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-slate-800">{e.title}</span>
              <Badge intent={e.status === 'open' ? (e.severity === 'high' ? 'bad' : 'warn') : 'ok'} className="ml-auto">
                {e.status === 'open' ? '待处理' : '已处置'}
              </Badge>
            </div>
            {e.resolution && <div className="mt-1 text-[12px] text-slate-500">{e.resolution.choice}</div>}
          </Link>
        ))}
      </div>
    </Card>
  );
}
