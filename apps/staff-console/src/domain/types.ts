/** 领域类型：只描述形状，不含任何数据。数据全部来自 public/data/*.json */

export type GateDim = 'basic' | 'consent' | 'history' | 'assessment' | 'measurement' | 'lactate';

export type StepCategory =
  | 'consent' | 'review' | 'interview' | 'questionnaire' | 'skin_prep' | 'provocation' | 'wait'
  | 'device' | 'imaging' | 'assessment' | 'gate' | 'product' | 'diary' | 'safety' | 'closeout';

export type Performer = 'staff' | 'subject' | 'both';
export type ResultKind = 'passfail' | 'score' | 'measure' | 'none';
export type Tone =
  | 'violet' | 'sky' | 'indigo' | 'cyan' | 'teal' | 'amber' | 'orange' | 'blue' | 'fuchsia'
  | 'emerald' | 'rose' | 'lime';

export interface MeasureDef {
  key: string;
  label: string;
  unit: string;
}

export interface StepTemplate {
  id: string;
  name: string;
  short: string;
  category: StepCategory;
  stationId: string;
  performer: Performer;
  standardMinutes: number;
  gateDim?: GateDim;
  isGateAnchor?: boolean;
  isBalance?: boolean;
  requiresBalance?: boolean;
  requiresEnrollment?: boolean;
  resultKind: ResultKind;
  icon: string;
  subjectCopy: string;
  checklist: string[];
  measures?: MeasureDef[];
}

export interface Station {
  id: string;
  name: string;
  room: string;
  capacity: number;
  staff: string[];
  tone: Tone;
}

export interface VisitPointDef {
  code: string;
  name: string;
  day: number;
  minus: number;
  plus: number;
  kind: 'screening' | 'followup' | 'final';
}

export interface Project {
  id: string;
  name: string;
  sponsor: string;
  product: string;
  blind: 'open' | 'single' | 'double';
  tone: Tone;
  pi: string;
  targetN: number;
  screenedN: number;
  enrolledN: number;
  visitPlan: VisitPointDef[];
}

export interface GuideStep {
  key: string;
  templateId: string;
  minutes?: number;
}

export interface GuideVersionMeta {
  version: number;
  publishedAt: string;
  publishedBy: string;
  note: string;
}

export interface PublishedGuide {
  projectId: string;
  visitPoint: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  history: GuideVersionMeta[];
  steps: GuideStep[];
  /** 旧版本快照：已签到的访视仍按签到时的版本执行 */
  snapshots?: Record<number, GuideStep[]>;
}

export type SubjectStatus = 'prospect' | 'screening' | 'enrolled' | 'screen_failed' | 'withdrawn' | 'completed';

export interface SubjectVisitRecord {
  code: string;
  date?: string;
  state: 'done' | 'today' | 'planned' | 'missed' | 'skipped';
  windowStart?: string;
  windowEnd?: string;
}

export interface Subject {
  id: string;
  name: string;
  gender: '女' | '男';
  age: number;
  phoneTail: string;
  idTail: string;
  projectId: string;
  sc: string;
  rd?: string;
  status: SubjectStatus;
  hue: number;
  skinType: string;
  visits: SubjectVisitRecord[];
}

export type VisitStatus =
  | 'scheduled' | 'no_show' | 'checked_in' | 'in_progress' | 'paused' | 'checked_out' | 'cancelled';

export type StepRunStatus = 'in_progress' | 'done' | 'failed' | 'on_hold' | 'waived';

export interface StepRun {
  status: StepRunStatus;
  start?: string;
  end?: string;
  operator?: string;
  result?: 'pass' | 'fail';
  values?: Record<string, string>;
  note?: string;
  override?: { by: string; reason: string; at: string };
}

export interface VisitWindow {
  start: string;
  target: string;
  end: string;
}

export type CheckinMethod = 'app_qr' | 'desk' | 'kiosk';

export interface CheckinInfo {
  no: string;
  at: string;
  method: CheckinMethod;
  verifiedBy: string;
}

export interface CheckoutInfo {
  at: string;
  by: string;
  outcome: 'complete' | 'incomplete' | 'terminated';
  reason?: string;
  nextAppointment?: string;
}

export type LogTone = 'info' | 'ok' | 'warn' | 'bad';

export interface VisitLog {
  at: string;
  actor: string;
  text: string;
  tone?: LogTone;
}

export interface TodayVisit {
  id: string;
  subjectId: string;
  projectId: string;
  visitPoint: string;
  guideVersion: number;
  slot: { start: string; end: string };
  window: VisitWindow;
  status: VisitStatus;
  checkin?: CheckinInfo;
  checkout?: CheckoutInfo;
  runs: Record<string, StepRun>;
  log: VisitLog[];
}

export type ExceptionType =
  | 'late' | 'no_show' | 'icf_refused' | 'step_failed' | 'lactate_abnormal' | 'mid_exit'
  | 'window_edge' | 'balance_override' | 'rescreen' | 'incomplete_checkout';

export interface ExceptionItem {
  id: string;
  type: ExceptionType;
  visitId?: string;
  subjectId: string;
  raisedAt: string;
  raisedBy: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
  slaMinutes: number;
  title: string;
  detail: string;
  options: string[];
  resolution?: { by: string; at: string; choice: string; note?: string };
}

export interface Criterion {
  id: string;
  kind: 'inclusion' | 'exclusion';
  text: string;
  source: GateDim;
}

export type Answer = 'yes' | 'no' | null;

export interface EligibilityCase {
  visitId: string;
  answers: Record<string, Answer>;
  evidence: Record<string, string>;
  decision?: { outcome: 'enrolled' | 'screen_failed'; reason?: string; by: string; at: string; rd?: string };
}

export interface Person {
  id: string;
  name: string;
  role: string;
  canOverride?: boolean;
  canSign?: boolean;
}

export interface SiteInfo {
  site: { id: string; name: string; short: string; address: string };
  today: string;
  weekday: string;
  clockStart: string;
  operator: { id: string; name: string; role: string; hue: number };
  people: Person[];
}

export interface Seed {
  site: SiteInfo;
  stations: Station[];
  templates: StepTemplate[];
  projects: Project[];
  guides: PublishedGuide[];
  subjects: Subject[];
  visits: TodayVisit[];
  exceptions: ExceptionItem[];
  criteria: Record<string, Criterion[]>;
  eligibility: EligibilityCase[];
}
