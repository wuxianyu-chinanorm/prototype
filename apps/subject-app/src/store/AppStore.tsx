import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { effectiveDone } from '../domain/journey';
import { nextVisit } from '../domain/schedule';
import { cnDate, hm, toSec } from '../domain/time';
import type { Content, DiaryEntry, JourneyStep, Scenario } from '../domain/types';

export interface Banner {
  id: number;
  title: string;
  body?: string;
}

interface State {
  content: Content;
  scenario: Scenario;
  now: number;
  running: boolean;
  entries: DiaryEntry[];
  unread: number;
  banner: Banner | null;
  seq: number;
}

type Action =
  | { type: 'tick'; sec: number }
  | { type: 'toggleClock' }
  | { type: 'scenario'; id: string }
  | { type: 'patch'; fn: (s: Scenario, steps: JourneyStep[], now: number) => Scenario; banner?: BannerFn }
  | { type: 'banner'; banner: Omit<Banner, 'id'> | null }
  | { type: 'diary'; day: number; slot: 'morning' | 'evening' }
  | { type: 'read' };

type BannerFn = (s: Scenario, c: Content, steps: JourneyStep[], now: number) => Omit<Banner, 'id'>;

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

function fromScenario(content: Content, s: Scenario): Partial<State> {
  return { scenario: clone(s), now: toSec(s.clock), unread: content.messages.filter((m) => m.unread).length };
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'tick':
      return { ...state, now: state.now + a.sec };
    case 'toggleClock':
      return { ...state, running: !state.running };
    case 'scenario': {
      const s = state.content.scenarios.find((x) => x.id === a.id);
      return s ? { ...state, ...fromScenario(state.content, s), banner: null } : state;
    }
    case 'patch': {
      const steps = state.content.journeys[state.scenario.visitPoint] ?? [];
      const seq = state.seq + 1;
      const scenario = a.fn(state.scenario, steps, state.now);
      const banner = a.banner ? { ...a.banner(scenario, state.content, steps, state.now), id: seq } : state.banner;
      return { ...state, scenario, seq, banner };
    }
    case 'banner': {
      const seq = state.seq + 1;
      return { ...state, seq, banner: a.banner ? { ...a.banner, id: seq } : null };
    }
    case 'diary': {
      const exists = state.entries.find((e) => e.day === a.day);
      const entries = exists
        ? state.entries.map((e) => (e.day === a.day ? { ...e, [a.slot]: !e[a.slot] } : e))
        : [...state.entries, { day: a.day, morning: a.slot === 'morning', evening: a.slot === 'evening' }];
      return { ...state, entries };
    }
    case 'read':
      return { ...state, unread: 0 };
  }
}

/** 当前第一个未完成步骤 */
function firstOpen(s: Scenario, steps: JourneyStep[], now: number): JourneyStep | undefined {
  const done = effectiveDone(s, steps, now);
  return steps.find((x) => !done.has(x.key) && !(s.enrollment === 'failed' && x.afterEnroll));
}

function nextAfter(steps: JourneyStep[], key: string, s: Scenario): JourneyStep | undefined {
  const i = steps.findIndex((x) => x.key === key);
  return steps.slice(i + 1).find((x) => !(s.enrollment === 'failed' && x.afterEnroll));
}

function useActions(dispatch: (a: Action) => void) {
  return useMemo(
    () => ({
      loadScenario: (id: string) => dispatch({ type: 'scenario', id }),
      login: () => dispatch({ type: 'patch', fn: (s) => ({ ...s, loggedIn: true }) }),
      checkIn: () =>
        dispatch({
          type: 'patch',
          fn: (s, _steps, now) => ({ ...s, checkin: { no: s.checkin?.no ?? `A${String(Math.floor(now / 60) % 40 + 1).padStart(2, '0')}`, at: hm(now) } }),
          banner: (s, _c, steps, now) => {
            const first = firstOpen(s, steps, now);
            return { title: `签到成功 · 签到号 ${s.checkin?.no ?? ''}`, body: first ? `第一站：${first.place}（${first.room}），请跟随「今日动线」前往` : undefined };
          },
        }),
      /** 模拟工位点「开始」 */
      stationStart: () =>
        dispatch({
          type: 'patch',
          fn: (s, steps, now) => {
            const cur = firstOpen(s, steps, now);
            return cur && !s.active ? { ...s, active: { key: cur.key, start: hm(now) } } : s;
          },
        }),
      /** 模拟工位点「完成」 */
      stationComplete: () =>
        dispatch({
          type: 'patch',
          fn: (s, steps, now) => {
            const cur = firstOpen(s, steps, now);
            if (!cur) return s;
            const next: Scenario = { ...s, done: [...s.done, cur.key], active: undefined };
            if (cur.key === 'consent' || cur.key === 'crc_review') next.consent = cur.key === 'crc_review' ? 'reviewed' : 'signed';
            if (cur.kind === 'gate' && s.enrollment === 'pending') next.enrollment = 'enrolled';
            if (cur.kind === 'self' && cur.key.startsWith('questionnaire')) next.questionnaire = 'done';
            return next;
          },
        }),
      signConsent: () =>
        dispatch({
          type: 'patch',
          fn: (s) => ({ ...s, consent: 'signed', done: s.done.includes('consent') ? s.done : [...s.done, 'consent'] }),
          banner: () => ({ title: '签名已提交', body: '请在知情室稍候，研究协调员会与你核对签字页' }),
        }),
      submitQuestionnaire: (key: string) =>
        dispatch({
          type: 'patch',
          fn: (s) => ({ ...s, questionnaire: 'done', done: s.done.includes(key) ? s.done : [...s.done, key] }),
          banner: () => ({ title: '问卷已提交', body: '谢谢！请按「今日动线」前往下一站' }),
        }),
      decide: (outcome: 'enrolled' | 'failed') =>
        dispatch({
          type: 'patch',
          fn: (s) => ({ ...s, enrollment: outcome, done: s.done.includes('gate') ? s.done : [...s.done, 'gate'] }),
          banner: () => (outcome === 'enrolled' ? { title: '筛选结果已出', body: '恭喜你正式加入研究' } : { title: '筛选结果已出', body: '感谢参与，请查看说明' }),
        }),
      checkout: () =>
        dispatch({
          type: 'patch',
          fn: (s) => ({ ...s, checkedOut: true }),
          banner: (s, c) => {
            const nv = s.enrollment === 'enrolled' ? nextVisit(c.schedule, s) : undefined;
            return { title: '已签出，路上注意安全', body: nv?.appointment ? `下次到访：${cnDate(nv.appointment.date)} ${nv.appointment.start}，前一天会提醒你` : '补偿将在 3 个工作日内到账' };
          },
        }),
      requestHelp: (what: string) => dispatch({ type: 'banner', banner: { title: '已通知工作人员', body: `${what} · 请在原地稍候，约 2 分钟内有人来` } }),
      notify: (title: string, body?: string) => dispatch({ type: 'banner', banner: { title, body } }),
      clearBanner: () => dispatch({ type: 'banner', banner: null }),
      toggleDiary: (day: number, slot: 'morning' | 'evening') => dispatch({ type: 'diary', day, slot }),
      reportSymptom: (text: string, doctor: string) => dispatch({ type: 'banner', banner: { title: '已上报研究医生', body: `${text} · ${doctor}医生会在 30 分钟内联系你` } }),
      markRead: () => dispatch({ type: 'read' }),
      nextAfter,
    }),
    [dispatch],
  );
}

export type Actions = ReturnType<typeof useActions>;

interface Value {
  content: Content;
  scenario: Scenario;
  steps: JourneyStep[];
  now: number;
  running: boolean;
  entries: DiaryEntry[];
  unread: number;
  banner: Banner | null;
  actions: Actions;
  advance(sec: number): void;
  toggleClock(): void;
}

const Ctx = createContext<Value | null>(null);

export function AppStoreProvider({ content, children }: { content: Content; children: ReactNode }) {
  const initial = content.scenarios.find((s) => s.id === 'eve') ?? content.scenarios[0]!;
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    content,
    scenario: clone(initial),
    now: toSec(initial.clock),
    running: true,
    entries: content.diary.entries,
    unread: content.messages.filter((m) => m.unread).length,
    banner: null,
    seq: 0,
  }));

  useEffect(() => {
    if (!state.running) return;
    const t = window.setInterval(() => dispatch({ type: 'tick', sec: 1 }), 1000);
    return () => window.clearInterval(t);
  }, [state.running]);

  useEffect(() => {
    if (!state.banner) return;
    const t = window.setTimeout(() => dispatch({ type: 'banner', banner: null }), 4200);
    return () => window.clearTimeout(t);
  }, [state.banner]);

  const actions = useActions(dispatch);
  const advance = useCallback((sec: number) => dispatch({ type: 'tick', sec }), []);
  const toggleClock = useCallback(() => dispatch({ type: 'toggleClock' }), []);
  const steps = state.content.journeys[state.scenario.visitPoint] ?? [];

  const value = useMemo<Value>(
    () => ({ ...state, steps, actions, advance, toggleClock }),
    [state, steps, actions, advance, toggleClock],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp 必须在 <AppStoreProvider> 内使用');
  return v;
}
