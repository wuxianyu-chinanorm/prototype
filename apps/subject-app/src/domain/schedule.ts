import { dayDiff, toSec } from './time';
import type { Scenario, ScheduledVisit } from './types';

export type VisitStatus = 'done' | 'today' | 'next' | 'later';

export function visitStatuses(schedule: ScheduledVisit[], s: Scenario): Record<string, VisitStatus> {
  const cur = schedule.findIndex((v) => v.code === s.visitPoint);
  const out: Record<string, VisitStatus> = {};
  schedule.forEach((v, i) => {
    if (i < cur) out[v.code] = 'done';
    else if (i === cur) out[v.code] = s.checkedOut ? 'done' : v.appointment?.date === s.today ? 'today' : 'next';
    else out[v.code] = i === cur + 1 && s.checkedOut ? 'next' : 'later';
  });
  return out;
}

export function nextVisit(schedule: ScheduledVisit[], s: Scenario): ScheduledVisit | undefined {
  const st = visitStatuses(schedule, s);
  return schedule.find((v) => st[v.code] === 'today' || st[v.code] === 'next');
}

/** 距离预约开始还有多少秒（负数表示已开始） */
export function secondsUntil(v: ScheduledVisit, today: string, now: number): number | undefined {
  if (!v.appointment) return undefined;
  return dayDiff(today, v.appointment.date) * 86400 + toSec(v.appointment.start) - now;
}

export function countdownText(sec: number): string {
  if (sec <= 0) return '已开始';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d >= 1) return `${d} 天 ${h} 小时`;
  if (h >= 1) return `${h} 小时 ${m} 分`;
  return `${m} 分钟`;
}
