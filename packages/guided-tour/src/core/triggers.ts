import type { TourDef } from './types';

const normalize = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

/** 支持精确匹配与 `/visits/*` 前缀匹配 */
export function routeMatches(pattern: string, pathname: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = normalize(pattern.slice(0, -2));
    const path = normalize(pathname);
    return path === base || path.startsWith(`${base}/`);
  }
  return normalize(pattern) === normalize(pathname);
}

export function findAutoTour(
  tours: readonly TourDef[],
  pathname: string,
  isSeen: (tourId: string) => boolean,
): TourDef | undefined {
  return tours.find(
    (t) => t.trigger.type === 'firstVisit' && routeMatches(t.trigger.route, pathname) && !isSeen(t.id),
  );
}
