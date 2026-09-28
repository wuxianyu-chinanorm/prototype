/** 受试者端领域类型。与工作人员端完全独立，只描述受试者看得到的东西。 */

export interface Profile {
  subject: { name: string; nickname: string; gender: string; age: number; phone: string; hue: number; sc: string; subjectNo: string };
  study: {
    title: string;
    short: string;
    sponsor: string;
    code: string;
    durationDays: number;
    takeHome: { title: string; sub: string }[];
    usage: string;
    visits: number;
    compensation: { item: string; amount: number }[];
  };
  site: { name: string; address: string; metro: string; parking: string; hours: string; slots: { start: string; left: number }[] };
  contacts: { role: string; name: string; phone: string; hint: string }[];
}

export interface PrepItem {
  id: string;
  text: string;
  why: string;
}

export interface ScheduledVisit {
  code: string;
  title: string;
  day: number;
  window: { start: string; end: string };
  appointment?: { date: string; start: string; end: string };
  durationText: string;
  prep: PrepItem[];
}

export type JourneyKind = 'self' | 'staff' | 'wait' | 'gate';

export interface JourneyStep {
  key: string;
  name: string;
  short: string;
  place: string;
  room: string;
  minutes: number;
  kind: JourneyKind;
  icon: string;
  tip: string;
  selfRoute?: string;
  afterEnroll?: boolean;
}

export interface ConsentDoc {
  version: string;
  approvedAt: string;
  ethics: string;
  readMinutes: number;
  sections: { id: string; title: string; summary: string; body: string }[];
  quiz: { id: string; q: string; options: string[]; answer: number; explain: string }[];
}

export type Question =
  | { id: string; type: 'single' | 'multi'; q: string; options: string[] }
  | { id: string; type: 'scale'; q: string; min: number; max: number; minLabel: string; maxLabel: string };

export interface Questionnaire {
  title: string;
  intro: string;
  questions: Question[];
}

export interface DiaryEntry {
  day: number;
  morning: boolean;
  evening: boolean;
  feeling?: 'mild' | 'moderate' | 'severe';
  note?: string;
}

export interface Diary {
  startDate: string;
  days: number;
  reminders: { morning: string; evening: string };
  entries: DiaryEntry[];
  symptoms: string[];
}

export interface Message {
  id: string;
  at: string;
  kind: 'reminder' | 'info' | 'alert';
  title: string;
  body: string;
  unread: boolean;
}

export interface Scenario {
  id: string;
  group: string;
  label: string;
  description: string;
  today: string;
  clock: string;
  loggedIn: boolean;
  visitPoint: string;
  checkin?: { no: string; at: string };
  done: string[];
  active?: { key: string; start: string };
  consent: 'todo' | 'signed' | 'reviewed';
  questionnaire: 'todo' | 'done';
  enrollment: 'pending' | 'enrolled' | 'failed';
  v1Done?: boolean;
  checkedOut?: boolean;
  queueAhead?: number;
  route: string;
}

export interface Annotation {
  route: string;
  title: string;
  points: string[];
}

export interface Content {
  profile: Profile;
  schedule: ScheduledVisit[];
  journeys: Record<string, JourneyStep[]>;
  consent: ConsentDoc;
  questionnaire: Questionnaire;
  diary: Diary;
  messages: Message[];
  scenarios: Scenario[];
  annotations: Annotation[];
}
