import { useMemo } from 'react';
import {
  currentStep,
  guideStepsFor,
  isSettled,
  resolveSteps,
  visitPhase,
  windowInfo,
  type Phase,
  type ResolvedStep,
  type WindowInfo,
} from '../domain/visitEngine';
import type { ExceptionItem, Project, PublishedGuide, Subject, TodayVisit } from '../domain/types';
import { useStore } from './StoreProvider';

export interface VisitContext {
  visit: TodayVisit;
  subject: Subject;
  project: Project;
  guide?: PublishedGuide;
  steps: ResolvedStep[];
  current?: ResolvedStep;
  phase: Phase;
  done: number;
  total: number;
  window: WindowInfo;
  openExceptions: ExceptionItem[];
}

export function useVisitContexts(): VisitContext[] {
  const { data, catalog, now } = useStore();
  return useMemo(() => {
    const subjects = new Map(data.subjects.map((s) => [s.id, s]));
    const projects = new Map(data.projects.map((p) => [p.id, p]));
    return data.visits.flatMap((visit) => {
      const subject = subjects.get(visit.subjectId);
      const project = projects.get(visit.projectId);
      if (!subject || !project) return [];
      const guide = data.guides.find((g) => g.projectId === visit.projectId && g.visitPoint === visit.visitPoint);
      const steps = resolveSteps(visit, guideStepsFor(guide, visit.guideVersion), catalog, now);
      return [
        {
          visit,
          subject,
          project,
          guide,
          steps,
          current: currentStep(steps),
          phase: visitPhase(visit, steps, now),
          done: steps.filter(isSettled).length,
          total: steps.length,
          window: windowInfo(visit.window, data.site.today),
          openExceptions: data.exceptions.filter((e) => e.visitId === visit.id && e.status === 'open'),
        },
      ];
    });
  }, [data, catalog, now]);
}

export function useVisitContext(id: string | undefined): VisitContext | undefined {
  const all = useVisitContexts();
  return all.find((c) => c.visit.id === id);
}

export const ONSITE: Phase[] = ['onsite', 'ready_checkout'];
