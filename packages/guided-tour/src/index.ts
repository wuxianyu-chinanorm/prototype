export type {
  Placement,
  TourCatalog,
  TourDef,
  TourEvent,
  TourLabels,
  TourStepDef,
  TourTrigger,
} from './core/types';
export { defaultLabels } from './core/types';
export { tourReducer, resolveActive, idleState } from './core/machine';
export type { ActiveTour, TourAction, TourState } from './core/machine';
export { routeMatches, findAutoTour } from './core/triggers';
export { placePopover } from './core/geometry';
export type { Rect, Size } from './core/geometry';

export {
  createLocalStorageProgressStore,
  createMemoryProgressStore,
} from './adapters/progressStore';
export type { TourOutcome, TourProgress, TourProgressStore } from './adapters/progressStore';
export { domTargetResolver, tourAnchor, TOUR_ATTR } from './adapters/targetResolver';
export type { TargetResolver } from './adapters/targetResolver';

export { TourProvider, useTour } from './react/TourProvider';
export type { TourContextValue, TourProviderProps } from './react/TourProvider';

export { TourHotspot } from './ui/TourHotspot';
