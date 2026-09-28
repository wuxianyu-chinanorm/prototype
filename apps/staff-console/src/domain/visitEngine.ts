import { dayDiff, mmss, toSec, addDays } from './time';
import type {
  ExceptionItem,
  GateDim,
  GuideStep,
  Project,
  PublishedGuide,
  Station,
  StepRun,
  StepTemplate,
  Subject,
  TodayVisit,
  VisitWindow,
} from './types';

/**
 * 访视引擎：由「已发布导检 + 现场执行记录 + 当前时间」推导每一步的可执行状态。
 * 纯函数，不持有状态。
 */

export type StepView = 'done' | 'active' | 'ready' | 'blocked' | 'failed' | 'hold' | 'waived';

export type BlockerCode = 'closed' | 'checkin' | 'paused' | 'consent' | 'balance' | 'previous' | 'enrollment';

export interface Blocker {
  code: BlockerCode;
  text: string;
}

export interface ResolvedStep {
  key: string;
  index: number;
  template: StepTemplate;
  station: Station;
  minutes: number;
  run?: StepRun;
  view: StepView;
  blockers: Blocker[];
  beforeGate: boolean;
  balanceRemainSec?: number;
  elapsedSec?: number;
}

export interface Catalog {
  templates: Map<string, StepTemplate>;
  stations: Map<string, Station>;
}

export function guideStepsFor(guide: PublishedGuide | undefined, version: number): GuideStep[] {
  if (!guide) return [];
  if (version === guide.version) return guide.steps;
  return guide.snapshots?.[version] ?? guide.steps;
}

function balanceState(run: StepRun | undefined, minutes: number, now: number) {
  if (!run) return { satisfied: false, remain: minutes * 60, running: false };
  if (run.status === 'done' || run.status === 'waived') return { satisfied: true, remain: 0, running: false };
  if (run.status === 'in_progress' && run.start) {
    const remain = Math.max(0, toSec(run.start) + minutes * 60 - now);
    return { satisfied: remain <= 0 || Boolean(run.override), remain, running: remain > 0 };
  }
  return { satisfied: false, remain: minutes * 60, running: false };
}

const CLOSED = new Set(['checked_out', 'no_show', 'cancelled']);

export function resolveSteps(visit: TodayVisit, guideSteps: GuideStep[], cat: Catalog, now: number): ResolvedStep[] {
  const gateIdx = guideSteps.findIndex((s) => cat.templates.get(s.templateId)?.isGateAnchor);
  const out: ResolvedStep[] = [];
  let firstOpen: ResolvedStep | undefined;
  let consentOpen = false;
  let lastBalance: ReturnType<typeof balanceState> | undefined;
  let gatePassed = false;

  guideSteps.forEach((gs, index) => {
    const template = cat.templates.get(gs.templateId);
    const station = template && cat.stations.get(template.stationId);
    if (!template || !station) return;
    const minutes = gs.minutes ?? template.standardMinutes;
    const run = visit.runs[gs.key];
    const bal = template.isBalance ? balanceState(run, minutes, now) : undefined;
    const blockers: Blocker[] = [];
    let view: StepView;
    let elapsedSec: number | undefined;

    if (run) {
      if (run.start && run.status === 'in_progress') elapsedSec = now - toSec(run.start);
      switch (run.status) {
        case 'done':
          view = 'done';
          break;
        case 'waived':
          view = 'waived';
          break;
        case 'failed':
          view = 'failed';
          break;
        case 'on_hold':
          view = 'hold';
          break;
        case 'in_progress':
          view = bal?.satisfied ? 'done' : 'active';
          break;
      }
    } else {
      if (CLOSED.has(visit.status)) blockers.push({ code: 'closed', text: '本次访视已结束' });
      else if (!visit.checkin) blockers.push({ code: 'checkin', text: '尚未签到' });
      else if (visit.status === 'paused') blockers.push({ code: 'paused', text: '受试者已离场' });
      if (consentOpen && template.category !== 'consent' && template.category !== 'review') {
        blockers.push({ code: 'consent', text: '知情同意未完成，不能开始研究操作' });
      }
      const balanceBlocks = Boolean(template.requiresBalance && lastBalance && !lastBalance.satisfied);
      if (balanceBlocks && lastBalance) {
        blockers.push({ code: 'balance', text: `平衡还剩 ${mmss(lastBalance.remain)}` });
      }
      if (firstOpen && !(balanceBlocks && firstOpen.template.isBalance)) {
        blockers.push({ code: 'previous', text: `等待「${firstOpen.template.name}」` });
      }
      if (template.requiresEnrollment && !gatePassed) blockers.push({ code: 'enrollment', text: '需先判定入组' });
      view = blockers.length ? 'blocked' : 'ready';
    }

    const step: ResolvedStep = {
      key: gs.key,
      index,
      template,
      station,
      minutes,
      run,
      view,
      blockers,
      beforeGate: gateIdx >= 0 && index < gateIdx,
      balanceRemainSec: bal?.running && !bal.satisfied ? bal.remain : undefined,
      elapsedSec,
    };
    out.push(step);

    const satisfied = view === 'done' || view === 'waived' || Boolean(bal?.satisfied);
    if (!satisfied && !firstOpen) firstOpen = step;
    if (template.category === 'consent' && view !== 'done') consentOpen = true;
    if (bal) lastBalance = bal;
    if (template.isGateAnchor && run?.status === 'done' && run.result === 'pass') gatePassed = true;
  });

  return out;
}

export const isSettled = (s: ResolvedStep) => s.view === 'done' || s.view === 'waived';

export function currentStep(steps: ResolvedStep[]): ResolvedStep | undefined {
  return steps.find((s) => !isSettled(s));
}

export type Phase = 'upcoming' | 'late' | 'no_show' | 'onsite' | 'ready_checkout' | 'paused' | 'checked_out' | 'cancelled';

export const LATE_GRACE_SEC = 10 * 60;

export function visitPhase(visit: TodayVisit, steps: ResolvedStep[], now: number): Phase {
  switch (visit.status) {
    case 'checked_out':
    case 'no_show':
    case 'cancelled':
    case 'paused':
      return visit.status;
  }
  if (!visit.checkin) return now > toSec(visit.slot.start) + LATE_GRACE_SEC ? 'late' : 'upcoming';
  if (steps.length > 0 && steps.every(isSettled)) return 'ready_checkout';
  return 'onsite';
}

export function lateMinutes(visit: TodayVisit, now: number): number {
  return Math.max(0, Math.floor((now - toSec(visit.slot.start)) / 60));
}

// ---------- 入组门禁 ----------

export type DimState = 'pass' | 'fail' | 'hold' | 'pending';

export const DIM_ORDER: GateDim[] = ['consent', 'basic', 'history', 'assessment', 'measurement', 'lactate'];

export const DIM_LABEL: Record<GateDim, string> = {
  consent: '知情',
  basic: '基础信息',
  history: '病史',
  assessment: '问卷评估',
  measurement: '测量筛',
  lactate: '乳酸',
};

export interface DimResult {
  dim: GateDim;
  state: DimState;
  steps: ResolvedStep[];
}

/** 只统计锚点之前、带维度的步骤；项目里不存在的维度不出现 */
export function gateDimensions(steps: ResolvedStep[]): DimResult[] {
  return DIM_ORDER.flatMap((dim) => {
    const group = steps.filter((s) => s.beforeGate && s.template.gateDim === dim);
    if (group.length === 0) return [];
    let state: DimState = 'pending';
    if (group.some((s) => s.view === 'failed' || s.run?.result === 'fail')) state = 'fail';
    else if (group.some((s) => s.view === 'hold')) state = 'hold';
    else if (group.every(isSettled)) state = 'pass';
    return [{ dim, state, steps: group }];
  });
}

export function gateStep(steps: ResolvedStep[]): ResolvedStep | undefined {
  return steps.find((s) => s.template.isGateAnchor);
}

// ---------- 访视窗 ----------

export type WindowState = 'fixed' | 'early' | 'in' | 'edge' | 'out';

export interface WindowInfo {
  state: WindowState;
  daysLeft: number;
  label: string;
}

export function windowInfo(w: VisitWindow, today: string): WindowInfo {
  const daysLeft = dayDiff(today, w.end);
  if (w.start === w.end) return { state: 'fixed', daysLeft, label: '当日' };
  if (dayDiff(w.start, today) < 0) return { state: 'early', daysLeft, label: '未到窗口' };
  if (daysLeft < 0) return { state: 'out', daysLeft, label: '已超窗' };
  if (daysLeft === 0) return { state: 'edge', daysLeft, label: '窗口末日' };
  if (dayDiff(w.start, today) === 0) return { state: 'in', daysLeft, label: '窗口首日' };
  return { state: 'in', daysLeft, label: `窗口内 · 剩 ${daysLeft} 天` };
}

export function nextVisitWindow(project: Project, subject: Subject, visitPoint: string, today: string) {
  const idx = project.visitPlan.findIndex((v) => v.code === visitPoint);
  const next = project.visitPlan[idx + 1];
  if (!next) return null;
  const anchor = subject.visits.find((v) => v.code === 'V1')?.date ?? today;
  const target = addDays(anchor, next.day);
  return { point: next, start: addDays(target, -next.minus), target, end: addDays(target, next.plus) };
}

// ---------- 签出 ----------

export interface CheckoutReadiness {
  ready: boolean;
  pending: ResolvedStep[];
  openExceptions: ExceptionItem[];
}

export function checkoutReadiness(visit: TodayVisit, steps: ResolvedStep[], exceptions: ExceptionItem[]): CheckoutReadiness {
  const pending = steps.filter((s) => !isSettled(s));
  const openExceptions = exceptions.filter((e) => e.visitId === visit.id && e.status === 'open');
  return { ready: pending.length === 0 && openExceptions.every((e) => e.severity !== 'high'), pending, openExceptions };
}

/** 该步骤在等待上一步完成时的等待时长（秒），用于工位队列排序 */
export function waitingSince(visit: TodayVisit, steps: ResolvedStep[], step: ResolvedStep): number | undefined {
  const prev = [...steps.slice(0, step.index)].reverse().find((s) => s.run?.end);
  const at = prev?.run?.end ?? visit.checkin?.at;
  return at ? toSec(at) : undefined;
}
