import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { idleState, resolveActive, tourReducer, type ActiveTour } from '../core/machine';
import { findAutoTour, routeMatches } from '../core/triggers';
import { defaultLabels, type TourCatalog, type TourDef, type TourEvent, type TourLabels } from '../core/types';
import type { TourOutcome, TourProgress, TourProgressStore } from '../adapters/progressStore';
import { domTargetResolver, type TargetResolver } from '../adapters/targetResolver';
import { TourOverlay } from '../ui/TourOverlay';

export interface TourContextValue {
  tours: readonly TourDef[];
  active: ActiveTour | null;
  progress: TourProgress;
  start(tourId: string): void;
  next(): void;
  prev(): void;
  skip(): void;
  reset(): void;
  isSeen(tourId: string): boolean;
}

const TourContext = createContext<TourContextValue | null>(null);
const EMPTY: readonly TourDef[] = [];

export interface TourProviderProps {
  catalog: TourCatalog | null;
  /** 路由适配：当前路径 + 跳转函数，由宿主路由库提供 */
  pathname: string;
  navigate: (to: string) => void;
  progressStore: TourProgressStore;
  resolver?: TargetResolver;
  /**
   * 浮层挂载容器。
   * undefined：挂到 document.body，覆盖整个视口；
   * null：容器尚未就绪，暂不渲染；
   * HTMLElement：限定在容器内（例如手机外框里的屏幕）。
   */
  container?: HTMLElement | null;
  autoStart?: boolean;
  autoStartDelayMs?: number;
  onEvent?: (e: TourEvent) => void;
  labels?: Partial<TourLabels>;
  children: ReactNode;
}

export function TourProvider({
  catalog,
  pathname,
  navigate,
  progressStore,
  resolver = domTargetResolver,
  container,
  autoStart = true,
  autoStartDelayMs = 500,
  onEvent,
  labels,
  children,
}: TourProviderProps) {
  const tours = catalog?.tours ?? EMPTY;
  const [state, dispatch] = useReducer(tourReducer, idleState);
  const [progress, setProgress] = useState<TourProgress>(() => progressStore.read());
  const active = useMemo(() => resolveActive(state, tours), [state, tours]);

  const onEventRef = useRef(onEvent);
  const pathnameRef = useRef(pathname);
  const navigateRef = useRef(navigate);
  useEffect(() => {
    onEventRef.current = onEvent;
    pathnameRef.current = pathname;
    navigateRef.current = navigate;
  });
  /** 导览刚结束时所在路由：同一路由上不再自动弹下一个导览 */
  const cooldownPath = useRef<string | null>(null);

  const isSeen = useCallback((id: string) => Boolean(progress[id]), [progress]);

  const end = useCallback(
    (outcome: TourOutcome) => {
      if (!active) return;
      setProgress(progressStore.write(active.tour.id, outcome));
      onEventRef.current?.(
        outcome === 'completed'
          ? { type: 'completed', tourId: active.tour.id }
          : { type: 'dismissed', tourId: active.tour.id, atStep: active.step.id },
      );
      cooldownPath.current = pathnameRef.current;
      dispatch({ type: 'stop' });
    },
    [active, progressStore],
  );

  const start = useCallback(
    (tourId: string) => {
      const tour = tours.find((t) => t.id === tourId);
      if (!tour || tour.steps.length === 0) return;
      dispatch({ type: 'start', tourId });
      onEventRef.current?.({ type: 'started', tourId });
    },
    [tours],
  );

  const next = useCallback(() => {
    if (!active) return;
    if (active.isLast) end('completed');
    else dispatch({ type: 'goto', index: active.index + 1, total: active.total });
  }, [active, end]);

  const prev = useCallback(() => {
    if (!active || active.isFirst) return;
    dispatch({ type: 'goto', index: active.index - 1, total: active.total });
  }, [active]);

  const skip = useCallback(() => end('dismissed'), [end]);

  const reset = useCallback(() => {
    setProgress(progressStore.clear());
    cooldownPath.current = null;
  }, [progressStore]);

  const activeKey = active ? `${active.tour.id}#${active.index}` : null;

  useEffect(() => {
    if (!active) return;
    onEventRef.current?.({ type: 'step', tourId: active.tour.id, stepId: active.step.id, index: active.index });
    const route = active.step.route;
    if (route && !routeMatches(route, pathnameRef.current)) navigateRef.current(route);
    // 仅在“进入新的一步”时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useEffect(() => {
    if (!autoStart || state.status !== 'idle' || tours.length === 0) return;
    if (cooldownPath.current !== null) {
      if (cooldownPath.current === pathname) return;
      cooldownPath.current = null;
    }
    const tour = findAutoTour(tours, pathname, isSeen);
    if (!tour) return;
    const timer = window.setTimeout(() => start(tour.id), autoStartDelayMs);
    return () => window.clearTimeout(timer);
  }, [autoStart, autoStartDelayMs, state.status, tours, pathname, isSeen, start]);

  const value = useMemo<TourContextValue>(
    () => ({ tours, active, progress, start, next, prev, skip, reset, isSeen }),
    [tours, active, progress, start, next, prev, skip, reset, isSeen],
  );

  const mergedLabels = useMemo(() => ({ ...defaultLabels, ...labels }), [labels]);
  const mountNode = container === undefined ? document.body : container;

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && mountNode
        ? createPortal(
            <TourOverlay
              key={active.tour.id}
              active={active}
              resolver={resolver}
              root={mountNode}
              scoped={container !== undefined}
              labels={mergedLabels}
              onNext={next}
              onPrev={prev}
              onSkip={skip}
            />,
            mountNode,
          )
        : null}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour 必须在 <TourProvider> 内使用');
  return ctx;
}
