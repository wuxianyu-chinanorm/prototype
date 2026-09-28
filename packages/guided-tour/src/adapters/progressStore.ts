/** 进度持久化适配器：引擎只依赖接口，存储介质可替换（localStorage / 内存 / 远端）。 */

export type TourOutcome = 'completed' | 'dismissed';

export interface TourProgressRecord {
  outcome: TourOutcome;
  at: string;
}

export type TourProgress = Readonly<Record<string, TourProgressRecord>>;

export interface TourProgressStore {
  read(): TourProgress;
  write(tourId: string, outcome: TourOutcome): TourProgress;
  clear(): TourProgress;
}

export function createLocalStorageProgressStore(key: string): TourProgressStore {
  const read = (): TourProgress => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as TourProgress) : {};
    } catch {
      return {};
    }
  };
  const save = (p: TourProgress) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(p));
    } catch {
      /* 隐私模式下写入失败时退化为本次会话有效 */
    }
    return p;
  };
  return {
    read,
    write: (tourId, outcome) => save({ ...read(), [tourId]: { outcome, at: new Date().toISOString() } }),
    clear: () => save({}),
  };
}

export function createMemoryProgressStore(initial: TourProgress = {}): TourProgressStore {
  let state: TourProgress = initial;
  return {
    read: () => state,
    write: (tourId, outcome) => (state = { ...state, [tourId]: { outcome, at: new Date().toISOString() } }),
    clear: () => (state = {}),
  };
}
