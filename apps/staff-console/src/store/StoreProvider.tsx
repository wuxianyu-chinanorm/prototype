import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import * as cmd from '../domain/commands';
import type { CommandResult, Ctx, Feedback } from '../domain/commands';
import { toSec } from '../domain/time';
import type { Catalog } from '../domain/visitEngine';
import type { Answer, CheckinMethod, CheckoutInfo, GuideStep, Seed } from '../domain/types';

export interface Toast extends Feedback {
  id: number;
}

interface State {
  data: Seed;
  now: number;
  running: boolean;
  toasts: Toast[];
  seq: number;
}

type Action =
  | { type: 'tick'; sec: number }
  | { type: 'toggleClock' }
  | { type: 'command'; actor?: string; run: (data: Seed, ctx: Ctx) => CommandResult }
  | { type: 'dismiss'; id: number };

function buildCatalog(data: Seed): Catalog {
  return {
    templates: new Map(data.templates.map((t) => [t.id, t])),
    stations: new Map(data.stations.map((s) => [s.id, s])),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick':
      return { ...state, now: state.now + action.sec };
    case 'toggleClock':
      return { ...state, running: !state.running };
    case 'dismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'command': {
      const ctx: Ctx = {
        now: state.now,
        actor: action.actor ?? state.data.site.operator.name,
        catalog: buildCatalog(state.data),
      };
      const { data, feedback } = action.run(state.data, ctx);
      const seq = state.seq + 1;
      return {
        ...state,
        data,
        seq,
        toasts: feedback ? [...state.toasts.slice(-3), { ...feedback, id: seq }] : state.toasts,
      };
    }
  }
}

function useActions(dispatch: (a: Action) => void) {
  return useMemo(
    () => ({
      checkIn: (visitId: string, method: CheckinMethod) =>
        dispatch({ type: 'command', run: (d, c) => cmd.checkIn(d, { visitId, method }, c) }),
      markNoShow: (visitId: string) => dispatch({ type: 'command', run: (d, c) => cmd.markNoShow(d, { visitId }, c) }),
      startStep: (visitId: string, key: string, actor?: string) =>
        dispatch({ type: 'command', actor, run: (d, c) => cmd.startStep(d, { visitId, key }, c) }),
      completeStep: (
        visitId: string,
        key: string,
        payload: { result?: 'pass' | 'fail'; values?: Record<string, string>; note?: string },
        actor?: string,
      ) => dispatch({ type: 'command', actor, run: (d, c) => cmd.completeStep(d, { visitId, key, ...payload }, c) }),
      overrideBalance: (visitId: string, reason: string, approver: string) =>
        dispatch({ type: 'command', actor: approver, run: (d, c) => cmd.overrideBalance(d, { visitId, reason, approver }, c) }),
      setAnswer: (visitId: string, criterionId: string, value: Answer) =>
        dispatch({ type: 'command', run: (d) => cmd.setAnswer(d, { visitId, criterionId, value }) }),
      decide: (visitId: string, outcome: 'enrolled' | 'screen_failed', signer: string, reason?: string) =>
        dispatch({ type: 'command', actor: signer, run: (d, c) => cmd.decide(d, { visitId, outcome, reason, signer }, c) }),
      checkout: (visitId: string, outcome: CheckoutInfo['outcome'], reason?: string, nextAppointment?: string) =>
        dispatch({ type: 'command', run: (d, c) => cmd.checkout(d, { visitId, outcome, reason, nextAppointment }, c) }),
      resolveException: (id: string, choice: string, note?: string, actor?: string) =>
        dispatch({ type: 'command', actor, run: (d, c) => cmd.resolveException(d, { id, choice, note }, c) }),
      publishGuide: (projectId: string, visitPoint: string, steps: GuideStep[], note: string, today: string) =>
        dispatch({ type: 'command', run: (d, c) => cmd.publishGuide(d, { projectId, visitPoint, steps, note, today }, c) }),
    }),
    [dispatch],
  );
}

export type Actions = ReturnType<typeof useActions>;

interface StoreValue {
  data: Seed;
  now: number;
  running: boolean;
  catalog: Catalog;
  toasts: Toast[];
  actions: Actions;
  advance(sec: number): void;
  toggleClock(): void;
  dismissToast(id: number): void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ seed, children }: { seed: Seed; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    data: seed,
    now: toSec(seed.site.clockStart),
    running: true,
    toasts: [],
    seq: 0,
  }));

  useEffect(() => {
    if (!state.running) return;
    const t = window.setInterval(() => dispatch({ type: 'tick', sec: 1 }), 1000);
    return () => window.clearInterval(t);
  }, [state.running]);

  const actions = useActions(dispatch);
  const catalog = useMemo(() => buildCatalog(state.data), [state.data]);
  const advance = useCallback((sec: number) => dispatch({ type: 'tick', sec }), []);
  const toggleClock = useCallback(() => dispatch({ type: 'toggleClock' }), []);
  const dismissToast = useCallback((id: number) => dispatch({ type: 'dismiss', id }), []);

  const value = useMemo<StoreValue>(
    () => ({ data: state.data, now: state.now, running: state.running, catalog, toasts: state.toasts, actions, advance, toggleClock, dismissToast }),
    [state, catalog, actions, advance, toggleClock, dismissToast],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 <StoreProvider> 内使用');
  return ctx;
}
