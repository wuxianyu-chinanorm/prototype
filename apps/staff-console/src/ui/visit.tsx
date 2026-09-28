import { Fragment } from 'react';
import type { Phase, ResolvedStep, StepView, WindowInfo } from '../domain/visitEngine';
import type { Project } from '../domain/types';
import { md, mmss } from '../domain/time';
import { Badge, cx } from './kit';
import { toneSolid, type Intent } from './tone';

export const PHASE: Record<Phase, { label: string; intent: Intent }> = {
  upcoming: { label: '待到', intent: 'neutral' },
  late: { label: '迟到', intent: 'warn' },
  no_show: { label: '缺席', intent: 'bad' },
  onsite: { label: '场内', intent: 'brand' },
  ready_checkout: { label: '待签出', intent: 'ok' },
  paused: { label: '中途离开', intent: 'bad' },
  checked_out: { label: '已签出', intent: 'neutral' },
  cancelled: { label: '已取消', intent: 'neutral' },
};

export function PhaseBadge({ phase }: { phase: Phase }) {
  const p = PHASE[phase];
  return (
    <Badge intent={p.intent} dot>
      {p.label}
    </Badge>
  );
}

export const VIEW: Record<StepView, { label: string; intent: Intent }> = {
  done: { label: '已完成', intent: 'ok' },
  active: { label: '进行中', intent: 'brand' },
  ready: { label: '可开始', intent: 'info' },
  blocked: { label: '未开始', intent: 'neutral' },
  failed: { label: '未通过', intent: 'bad' },
  hold: { label: '已挂起', intent: 'warn' },
  waived: { label: '免做', intent: 'neutral' },
};

export function WindowBadge({ info }: { info: WindowInfo }) {
  const intent: Intent = info.state === 'out' ? 'bad' : info.state === 'edge' ? 'warn' : info.state === 'early' ? 'bad' : info.state === 'fixed' ? 'neutral' : 'ok';
  return <Badge intent={intent}>{info.label}</Badge>;
}

export function ProjectChip({ project, visitPoint }: { project: Project; visitPoint?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100/80 px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">
      <span className={cx('size-1.5 rounded-full', toneSolid[project.tone])} />
      {project.id}
      {visitPoint && <span className="font-semibold text-slate-900">{visitPoint}</span>}
    </span>
  );
}

const dotCls: Record<StepView, string> = {
  done: 'bg-emerald-500',
  active: 'bg-teal-500 ring-4 ring-teal-500/20 animate-pulse',
  ready: 'bg-white ring-2 ring-inset ring-teal-500',
  blocked: 'bg-slate-200',
  failed: 'bg-rose-500',
  hold: 'bg-amber-400 ring-4 ring-amber-400/20',
  waived: 'bg-slate-300/70',
};

/** 圆点链：一个点一步，竖线是入组判定锚点 */
export function StepChain({ steps, size = 'md' }: { steps: ResolvedStep[]; size?: 'sm' | 'md' }) {
  const d = size === 'sm' ? 'size-2' : 'size-2.5';
  return (
    <div className="flex items-center gap-[5px]">
      {steps.map((s) => (
        <Fragment key={s.key}>
          {s.template.isGateAnchor && <span className="mx-0.5 h-3.5 w-[2px] rounded-full bg-rose-400/80" title="入组判定锚点" />}
          <span title={`${s.template.name} · ${VIEW[s.view].label}`} className={cx('shrink-0 rounded-full transition-all', d, dotCls[s.view])} />
        </Fragment>
      ))}
    </div>
  );
}

export function StepWhere({ step }: { step?: ResolvedStep }) {
  if (!step) return <span className="text-slate-400">—</span>;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
        <span className="truncate">{step.template.name}</span>
        {step.balanceRemainSec !== undefined && (
          <span className="rounded bg-teal-50 px-1 font-mono text-[11px] text-teal-700 tabular-nums">{mmss(step.balanceRemainSec)}</span>
        )}
      </div>
      <div className="truncate text-[11.5px] text-slate-500">
        {step.station.name}
        {step.view === 'blocked' && step.blockers[0] ? ` · ${step.blockers[0].text}` : ''}
        {step.view === 'hold' ? ' · 已挂起' : ''}
      </div>
    </div>
  );
}

export function WindowText({ start, end }: { start: string; end: string }) {
  return <span className="tabular-nums">{start === end ? md(start) : `${md(start)}–${md(end)}`}</span>;
}
