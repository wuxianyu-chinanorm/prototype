import type { TourCatalog } from '@vfp/guided-tour';
import type {
  Annotation, ConsentDoc, Content, Diary, JourneyStep, Message, Profile, Questionnaire, Scenario, ScheduledVisit,
} from '../domain/types';

/** 数据访问层：唯一知道数据来源的地方。原型读 public/data/*.json。 */

const BASE = `${import.meta.env.BASE_URL}subject/data/`;

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${BASE}${name}.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`加载 ${name}.json 失败（${res.status}）`);
  return (await res.json()) as T;
}

export async function loadContent(): Promise<Content> {
  const [profile, schedule, journeys, consent, questionnaire, diary, messages, scenarios, annotations] = await Promise.all([
    fetchJson<Profile>('profile'),
    fetchJson<ScheduledVisit[]>('schedule'),
    fetchJson<Record<string, JourneyStep[]>>('journeys'),
    fetchJson<ConsentDoc>('consent'),
    fetchJson<Questionnaire>('questionnaire'),
    fetchJson<Diary>('diary'),
    fetchJson<Message[]>('messages'),
    fetchJson<Scenario[]>('scenarios'),
    fetchJson<Annotation[]>('annotations'),
  ]);
  return { profile, schedule, journeys, consent, questionnaire, diary, messages, scenarios, annotations };
}

export const loadTours = () => fetchJson<TourCatalog>('tours');
