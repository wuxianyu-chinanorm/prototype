import type { TourCatalog } from '@vfp/guided-tour';
import type {
  Criterion,
  EligibilityCase,
  ExceptionItem,
  Project,
  PublishedGuide,
  Seed,
  SiteInfo,
  Station,
  StepTemplate,
  Subject,
  TodayVisit,
} from '../domain/types';

/**
 * 数据访问层：唯一知道数据从哪里来的地方。
 * 原型阶段读 public/data/*.json；接真实后端时只替换这里。
 */

const BASE = `${import.meta.env.BASE_URL}staff/data/`;

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${BASE}${name}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`加载 ${name}.json 失败（${res.status}）`);
  return (await res.json()) as T;
}

export async function loadSeed(): Promise<Seed> {
  const [site, stations, templates, projects, guides, subjects, visits, exceptions, elig] = await Promise.all([
    fetchJson<SiteInfo>('site'),
    fetchJson<Station[]>('stations'),
    fetchJson<StepTemplate[]>('step-library'),
    fetchJson<Project[]>('projects'),
    fetchJson<PublishedGuide[]>('guides'),
    fetchJson<Subject[]>('subjects'),
    fetchJson<TodayVisit[]>('visits-today'),
    fetchJson<ExceptionItem[]>('exceptions'),
    fetchJson<{ criteria: Record<string, Criterion[]>; cases: EligibilityCase[] }>('eligibility'),
  ]);
  return {
    site,
    stations,
    templates,
    projects,
    guides,
    subjects,
    visits,
    exceptions,
    criteria: elig.criteria,
    eligibility: elig.cases,
  };
}

export function loadTours(): Promise<TourCatalog> {
  return fetchJson<TourCatalog>('tours');
}
