import type { Tone } from '../domain/types';

/** Tailwind 需要静态类名，所以色板映射集中在这里 */

export const toneSolid: Record<Tone, string> = {
  violet: 'bg-violet-500', sky: 'bg-sky-500', indigo: 'bg-indigo-500', cyan: 'bg-cyan-500', teal: 'bg-teal-500',
  amber: 'bg-amber-500', orange: 'bg-orange-500', blue: 'bg-blue-500', fuchsia: 'bg-fuchsia-500',
  emerald: 'bg-emerald-500', rose: 'bg-rose-500', lime: 'bg-lime-500',
};

export const toneSoft: Record<Tone, string> = {
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/70',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200/70',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200/70',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200/70',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200/70',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200/70',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200/70',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  lime: 'bg-lime-50 text-lime-700 ring-lime-200/70',
};

export const toneText: Record<Tone, string> = {
  violet: 'text-violet-600', sky: 'text-sky-600', indigo: 'text-indigo-600', cyan: 'text-cyan-600', teal: 'text-teal-600',
  amber: 'text-amber-600', orange: 'text-orange-600', blue: 'text-blue-600', fuchsia: 'text-fuchsia-600',
  emerald: 'text-emerald-600', rose: 'text-rose-600', lime: 'text-lime-600',
};

export const toneGradient: Record<Tone, string> = {
  violet: 'from-violet-500 to-indigo-500', sky: 'from-sky-500 to-blue-500', indigo: 'from-indigo-500 to-violet-500',
  cyan: 'from-cyan-500 to-sky-500', teal: 'from-teal-500 to-emerald-500', amber: 'from-amber-500 to-orange-500',
  orange: 'from-orange-500 to-rose-500', blue: 'from-blue-500 to-indigo-500', fuchsia: 'from-fuchsia-500 to-pink-500',
  emerald: 'from-emerald-500 to-teal-500', rose: 'from-rose-500 to-pink-500', lime: 'from-lime-500 to-emerald-500',
};

export type Intent = 'neutral' | 'ok' | 'info' | 'warn' | 'bad' | 'brand' | 'violet';

export const intentSoft: Record<Intent, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  info: 'bg-sky-50 text-sky-700 ring-sky-200/80',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  bad: 'bg-rose-50 text-rose-700 ring-rose-200/80',
  brand: 'bg-teal-50 text-teal-700 ring-teal-200/80',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200/80',
};

export const intentDot: Record<Intent, string> = {
  neutral: 'bg-slate-400', ok: 'bg-emerald-500', info: 'bg-sky-500', warn: 'bg-amber-500', bad: 'bg-rose-500',
  brand: 'bg-teal-500', violet: 'bg-violet-500',
};
