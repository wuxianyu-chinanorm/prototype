const pad = (n: number) => String(n).padStart(2, '0');

export function toSec(hm: string): number {
  const [h = '0', m = '0', s = '0'] = hm.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export const hm = (sec: number) => `${pad(Math.floor(sec / 3600) % 24)}:${pad(Math.floor(sec / 60) % 60)}`;

export function mmss(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

const DAY = 86400000;
const parse = (iso: string) => new Date(`${iso}T00:00:00`);

export const dayDiff = (from: string, to: string) => Math.round((parse(to).getTime() - parse(from).getTime()) / DAY);

export function addDays(iso: string, n: number): string {
  const d = new Date(parse(iso).getTime() + n * DAY);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const weekday = (iso: string) => WEEK[parse(iso).getDay()] ?? '';

export function cnDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}月${Number(d)}日`;
}

export const md = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
};
