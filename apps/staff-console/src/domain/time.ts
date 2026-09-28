const pad = (n: number) => String(n).padStart(2, '0');

/** "09:42" 或 "09:42:10" → 当天秒数 */
export function toSec(hm: string): number {
  const [h = '0', m = '0', s = '0'] = hm.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export function hm(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}`;
}

export function mmss(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** 分钟数的人话：5 分钟 / 1 小时 20 分 */
export function humanMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} 小时 ${r} 分` : `${h} 小时`;
}

const DAY = 86400000;
const parseDate = (iso: string) => new Date(`${iso}T00:00:00`);

export function dayDiff(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(parseDate(iso).getTime() + days * DAY);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-09-28" → "9/28" */
export function md(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export function weekday(iso: string): string {
  return WEEK[parseDate(iso).getDay()] ?? '';
}
