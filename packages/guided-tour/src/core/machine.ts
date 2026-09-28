import type { TourDef, TourStepDef } from './types';

/** 导览状态机：只关心“哪一个导览、第几步”，副作用交给上层。 */
export type TourState =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; readonly tourId: string; readonly index: number };

export type TourAction =
  | { type: 'start'; tourId: string; index?: number }
  | { type: 'goto'; index: number; total: number }
  | { type: 'stop' };

export const idleState: TourState = { status: 'idle' };

export function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'start':
      return { status: 'running', tourId: action.tourId, index: Math.max(0, action.index ?? 0) };
    case 'goto':
      if (state.status !== 'running' || action.index < 0) return state;
      if (action.index >= action.total) return idleState;
      return { ...state, index: action.index };
    case 'stop':
      return idleState;
  }
}

export interface ActiveTour {
  tour: TourDef;
  step: TourStepDef;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
}

export function resolveActive(state: TourState, tours: readonly TourDef[]): ActiveTour | null {
  if (state.status !== 'running') return null;
  const tour = tours.find((t) => t.id === state.tourId);
  const step = tour?.steps[state.index];
  if (!tour || !step) return null;
  const total = tour.steps.length;
  return { tour, step, index: state.index, total, isFirst: state.index === 0, isLast: state.index === total - 1 };
}
