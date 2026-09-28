import { toSec } from './time';
import type { JourneyStep, Scenario } from './types';

/** 受试者视角的今日动线推导：只关心「我现在该干什么」。 */

export type StepState = 'done' | 'now' | 'waiting' | 'upcoming' | 'locked' | 'skipped';

export interface JourneyView {
  step: JourneyStep;
  state: StepState;
  remainSec?: number;
}

export type NowMode =
  | { mode: 'not_checked_in' }
  | { mode: 'go'; step: JourneyStep; queueAhead: number }
  | { mode: 'self'; step: JourneyStep }
  | { mode: 'in_progress'; step: JourneyStep; elapsedSec: number }
  | { mode: 'balance'; step: JourneyStep; remainSec: number; totalSec: number }
  | { mode: 'await_review'; step: JourneyStep }
  | { mode: 'gate'; step: JourneyStep }
  | { mode: 'finished' }
  | { mode: 'screen_failed' };

export function balanceRemain(s: Scenario, step: JourneyStep, now: number): number | undefined {
  if (s.active?.key !== step.key || step.kind !== 'wait') return undefined;
  return Math.max(0, toSec(s.active.start) + step.minutes * 60 - now);
}

/** 平衡计时走完视为完成 */
export function effectiveDone(s: Scenario, steps: JourneyStep[], now: number): Set<string> {
  const done = new Set(s.done);
  for (const st of steps) {
    const r = balanceRemain(s, st, now);
    if (r !== undefined && r <= 0) done.add(st.key);
  }
  return done;
}

export function viewJourney(s: Scenario, steps: JourneyStep[], now: number): JourneyView[] {
  const done = effectiveDone(s, steps, now);
  const firstOpen = steps.find((x) => !done.has(x.key));
  return steps.map((step) => {
    if (s.enrollment === 'failed' && step.afterEnroll) return { step, state: 'skipped' };
    if (done.has(step.key)) return { step, state: 'done' };
    if (step === firstOpen) {
      const r = balanceRemain(s, step, now);
      return { step, state: s.active?.key === step.key ? 'now' : 'waiting', remainSec: r };
    }
    if (step.afterEnroll && s.enrollment !== 'enrolled') return { step, state: 'locked' };
    return { step, state: 'upcoming' };
  });
}

export function nowMode(s: Scenario, steps: JourneyStep[], now: number): NowMode {
  if (!s.checkin) return { mode: 'not_checked_in' };
  if (s.enrollment === 'failed') return { mode: 'screen_failed' };
  const done = effectiveDone(s, steps, now);
  const step = steps.find((x) => !done.has(x.key));
  if (!step) return { mode: 'finished' };
  if (step.kind === 'wait' && s.active?.key === step.key) {
    return { mode: 'balance', step, remainSec: balanceRemain(s, step, now) ?? 0, totalSec: step.minutes * 60 };
  }
  if (step.kind === 'gate') return { mode: 'gate', step };
  if (step.key === 'crc_review' || (step.key === 'consent' && s.consent === 'signed')) return { mode: 'await_review', step };
  if (s.active?.key === step.key) return { mode: 'in_progress', step, elapsedSec: now - toSec(s.active.start) };
  if (step.kind === 'self') return { mode: 'self', step };
  return { mode: 'go', step, queueAhead: s.queueAhead ?? 0 };
}
