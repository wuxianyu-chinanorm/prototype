import type { Placement } from './types';

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PlacedPopover {
  top: number;
  left: number;
  placement: Placement;
}

const opposite: Record<Exclude<Placement, 'center'>, Exclude<Placement, 'center'>> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function order(preferred: Exclude<Placement, 'center'>): Exclude<Placement, 'center'>[] {
  const all: Exclude<Placement, 'center'>[] = ['bottom', 'right', 'top', 'left'];
  return [preferred, opposite[preferred], ...all.filter((p) => p !== preferred && p !== opposite[preferred])];
}

function coords(a: Rect, pop: Size, p: Exclude<Placement, 'center'>, gap: number) {
  switch (p) {
    case 'bottom':
      return { top: a.top + a.height + gap, left: a.left + a.width / 2 - pop.width / 2 };
    case 'top':
      return { top: a.top - gap - pop.height, left: a.left + a.width / 2 - pop.width / 2 };
    case 'right':
      return { top: a.top + a.height / 2 - pop.height / 2, left: a.left + a.width + gap };
    case 'left':
      return { top: a.top + a.height / 2 - pop.height / 2, left: a.left - gap - pop.width };
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/** 纯几何：给定锚点与视口，算出浮窗位置，放不下就翻转，最后夹在视口内 */
export function placePopover(
  anchor: Rect | null,
  pop: Size,
  viewport: Size,
  preferred: Placement = 'bottom',
  gap = 14,
  margin = 12,
): PlacedPopover {
  if (!anchor || preferred === 'center') {
    return {
      top: Math.max(margin, (viewport.height - pop.height) / 2),
      left: Math.max(margin, (viewport.width - pop.width) / 2),
      placement: 'center',
    };
  }
  for (const p of order(preferred)) {
    const c = coords(anchor, pop, p, gap);
    const fitsMain =
      p === 'bottom'
        ? c.top + pop.height <= viewport.height - margin
        : p === 'top'
          ? c.top >= margin
          : p === 'right'
            ? c.left + pop.width <= viewport.width - margin
            : c.left >= margin;
    if (fitsMain) {
      return {
        top: clamp(c.top, margin, viewport.height - pop.height - margin),
        left: clamp(c.left, margin, viewport.width - pop.width - margin),
        placement: p,
      };
    }
  }
  const c = coords(anchor, pop, preferred, gap);
  return {
    top: clamp(c.top, margin, viewport.height - pop.height - margin),
    left: clamp(c.left, margin, viewport.width - pop.width - margin),
    placement: preferred,
  };
}

export function inflate(r: Rect, pad: number): Rect {
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

export function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}
