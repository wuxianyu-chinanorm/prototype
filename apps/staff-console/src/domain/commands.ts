import { hm } from './time';
import { guideStepsFor, resolveSteps, type Catalog } from './visitEngine';
import type {
  Answer,
  CheckinMethod,
  CheckoutInfo,
  ExceptionItem,
  GuideStep,
  LogTone,
  Seed,
  StepRun,
  Subject,
  TodayVisit,
} from './types';

/**
 * 业务命令：纯函数 (data, 参数, 上下文) → 新 data + 给用户的反馈。
 * UI 与 store 都不写业务规则，只调这里。
 */

export interface Ctx {
  now: number;
  actor: string;
  catalog: Catalog;
}

export interface Feedback {
  tone: 'ok' | 'info' | 'warn' | 'bad';
  title: string;
  detail?: string;
}

export interface CommandResult {
  data: Seed;
  feedback?: Feedback;
}

// ---------- 小工具 ----------

function patchVisit(data: Seed, id: string, fn: (v: TodayVisit) => TodayVisit): Seed {
  return { ...data, visits: data.visits.map((v) => (v.id === id ? fn(v) : v)) };
}

function patchSubject(data: Seed, id: string, fn: (s: Subject) => Subject): Seed {
  return { ...data, subjects: data.subjects.map((s) => (s.id === id ? fn(s) : s)) };
}

function withLog(v: TodayVisit, at: number, actor: string, text: string, tone: LogTone = 'info'): TodayVisit {
  return { ...v, log: [...v.log, { at: hm(at), actor, text, tone }] };
}

function setRun(v: TodayVisit, key: string, run: StepRun | undefined): TodayVisit {
  const runs = { ...v.runs };
  if (run) runs[key] = run;
  else delete runs[key];
  return { ...v, runs };
}

function raise(data: Seed, item: Omit<ExceptionItem, 'id' | 'status'>): Seed {
  const id = `ex${String(data.exceptions.length + 1).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6)}`;
  return { ...data, exceptions: [{ ...item, id, status: 'open' }, ...data.exceptions] };
}

function resolveOpen(data: Seed, visitId: string, type: ExceptionItem['type'], ctx: Ctx, choice: string): Seed {
  return {
    ...data,
    exceptions: data.exceptions.map((e) =>
      e.visitId === visitId && e.type === type && e.status === 'open'
        ? { ...e, status: 'resolved', resolution: { by: ctx.actor, at: hm(ctx.now), choice } }
        : e,
    ),
  };
}

const find = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id);

function stepsOf(data: Seed, visit: TodayVisit, ctx: Ctx) {
  const guide = data.guides.find((g) => g.projectId === visit.projectId && g.visitPoint === visit.visitPoint);
  return resolveSteps(visit, guideStepsFor(guide, visit.guideVersion), ctx.catalog, ctx.now);
}

/** 平衡计时已满（或督导批准提前）时，把平衡落成完成态 */
function settleBalances(data: Seed, visit: TodayVisit, ctx: Ctx): TodayVisit {
  let next = visit;
  for (const s of stepsOf(data, visit, ctx)) {
    if (!s.template.isBalance || s.run?.status !== 'in_progress') continue;
    const due = s.balanceRemainSec === undefined || Boolean(s.run.override);
    if (due) next = setRun(next, s.key, { ...s.run, status: 'done', end: hm(ctx.now) });
  }
  return next;
}

function nextCheckinNo(data: Seed): string {
  const max = data.visits.reduce((m, v) => Math.max(m, Number(v.checkin?.no.slice(1) ?? 0)), 0);
  return `A${String(max + 1).padStart(2, '0')}`;
}

function nextRandomNo(data: Seed, projectId: string): string {
  const inProject = data.subjects.filter((s) => s.projectId === projectId && s.rd);
  const prefix = inProject[0]?.rd?.[0] ?? 'R';
  const max = inProject.reduce((m, s) => Math.max(m, Number(s.rd?.slice(1) ?? 0)), 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function nextScreeningNo(data: Seed, projectId: string): string {
  const max = data.subjects
    .filter((s) => s.projectId === projectId)
    .reduce((m, s) => Math.max(m, Number(s.sc.replace(/\D/g, '')) || 0), 0);
  return `SC-${String(max + 1).padStart(3, '0')}`;
}

// ---------- 进门 ----------

export function checkIn(data: Seed, p: { visitId: string; method: CheckinMethod }, ctx: Ctx): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit || visit.checkin) return { data };
  const no = nextCheckinNo(data);
  let next = patchVisit(data, visit.id, (v) =>
    withLog(
      { ...v, status: 'checked_in', checkin: { no, at: hm(ctx.now), method: p.method, verifiedBy: ctx.actor } },
      ctx.now,
      ctx.actor,
      `签到成功，签到号 ${no}；已推送第一站到受试者手机`,
      'ok',
    ),
  );
  const subject = find(next.subjects, visit.subjectId);
  if (subject?.status === 'prospect') {
    const sc = nextScreeningNo(next, subject.projectId);
    next = patchSubject(next, subject.id, (s) => ({ ...s, status: 'screening', sc }));
  }
  next = resolveOpen(next, visit.id, 'late', ctx, '已到场签到');
  const first = stepsOf(next, find(next.visits, visit.id)!, ctx)[0];
  return {
    data: next,
    feedback: {
      tone: 'ok',
      title: `${subject?.name ?? ''} 已签到 · ${no}`,
      detail: first ? `第一站：${first.template.name} @ ${first.station.name}` : undefined,
    },
  };
}

export function markNoShow(data: Seed, p: { visitId: string }, ctx: Ctx): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit || visit.checkin) return { data };
  const subject = find(data.subjects, visit.subjectId);
  let next = patchVisit(data, visit.id, (v) =>
    withLog({ ...v, status: 'no_show' }, ctx.now, ctx.actor, '标记缺席，待改约', 'bad'),
  );
  next = patchSubject(next, visit.subjectId, (s) => ({
    ...s,
    visits: s.visits.map((r) => (r.code === visit.visitPoint ? { ...r, state: 'missed' } : r)),
  }));
  next = resolveOpen(next, visit.id, 'late', ctx, '标记缺席并改约');
  next = raise(next, {
    type: 'no_show',
    visitId: visit.id,
    subjectId: visit.subjectId,
    raisedAt: hm(ctx.now),
    raisedBy: ctx.actor,
    severity: 'medium',
    slaMinutes: 120,
    title: `${visit.visitPoint} 缺席，需在窗口内改约`,
    detail: `窗口 ${visit.window.start} – ${visit.window.end}`,
    options: ['已改约（窗口内）', '继续联系', '超窗风险上报 PI'],
  });
  return { data: next, feedback: { tone: 'warn', title: `${subject?.name ?? ''} 已标记缺席`, detail: '已生成改约任务' } };
}

// ---------- 工位 ----------

export function startStep(data: Seed, p: { visitId: string; key: string }, ctx: Ctx): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit) return { data };
  const settled = settleBalances(data, visit, ctx);
  const step = stepsOf(data, settled, ctx).find((s) => s.key === p.key);
  if (!step || step.view !== 'ready') {
    return { data, feedback: { tone: 'bad', title: '还不能开始', detail: step?.blockers[0]?.text } };
  }
  const operator = step.template.performer === 'subject' ? '受试者自助' : ctx.actor;
  const next = patchVisit(data, visit.id, () =>
    withLog(
      setRun({ ...settled, status: 'in_progress' }, p.key, { status: 'in_progress', start: hm(ctx.now), operator }),
      ctx.now,
      ctx.actor,
      `开始「${step.template.name}」@ ${step.station.name}`,
    ),
  );
  return { data: next, feedback: { tone: 'info', title: `已开始 ${step.template.name}` } };
}

export function completeStep(
  data: Seed,
  p: { visitId: string; key: string; result?: 'pass' | 'fail'; values?: Record<string, string>; note?: string },
  ctx: Ctx,
): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit) return { data };
  const steps = stepsOf(data, visit, ctx);
  const step = steps.find((s) => s.key === p.key);
  if (!step || step.view !== 'active' || !step.run) return { data };
  const subject = find(data.subjects, visit.subjectId);
  const t = step.template;

  const lactateAbnormal = t.id === 'lactate' && Number(p.values?.score ?? 0) >= 2;
  const result = lactateAbnormal ? 'fail' : p.result;
  const failed = result === 'fail' && !lactateAbnormal;

  let v = setRun(visit, p.key, {
    ...step.run,
    status: failed ? 'failed' : 'done',
    end: hm(ctx.now),
    result,
    values: p.values,
    note: p.note,
    operator: step.run.operator ?? ctx.actor,
  });
  v = withLog(v, ctx.now, ctx.actor, `完成「${t.name}」${result === 'fail' ? '（异常）' : ''}`, result === 'fail' ? 'bad' : 'ok');

  let next = patchVisit(data, visit.id, () => v);

  if (lactateAbnormal) {
    const hold = steps.slice(step.index + 1).find((s) => s.template.category === 'device');
    if (hold) {
      next = patchVisit(next, visit.id, (x) =>
        setRun(x, hold.key, { status: 'on_hold', note: '乳酸评分 ≥2，挂起等待医学判断' }),
      );
    }
    next = raise(next, {
      type: 'lactate_abnormal',
      visitId: visit.id,
      subjectId: visit.subjectId,
      raisedAt: hm(ctx.now),
      raisedBy: ctx.actor,
      severity: 'high',
      slaMinutes: 15,
      title: `乳酸刺痛评分 ${p.values?.score}，后续测量已挂起`,
      detail: '方案规定评分 ≥2 需研究医生判断是否继续。',
      options: ['医学判断：可继续测量', '医学判断：终止筛选（筛败）'],
    });
    return { data: next, feedback: { tone: 'bad', title: '乳酸评分异常，已挂起后续测量', detail: '已通知研究医生，见异常中心' } };
  }

  if (failed) {
    next = raise(next, {
      type: 'step_failed',
      visitId: visit.id,
      subjectId: visit.subjectId,
      raisedAt: hm(ctx.now),
      raisedBy: ctx.actor,
      severity: step.beforeGate ? 'high' : 'medium',
      slaMinutes: 20,
      title: `「${t.name}」未通过`,
      detail: step.beforeGate ? `门禁维度将判为失败。${p.note ?? ''}` : p.note ?? '需决定是否补做',
      options: step.beforeGate ? ['确认筛败', '安排复测'] : ['安排补做', '记录偏离'],
    });
  }

  const after = stepsOf(next, find(next.visits, visit.id)!, ctx);
  const upcoming = after.find((s) => s.view !== 'done' && s.view !== 'waived');
  return {
    data: next,
    feedback: failed
      ? { tone: 'bad', title: `${t.name} 未通过`, detail: '已生成异常' }
      : {
          tone: 'ok',
          title: `${subject?.name ?? ''} · ${t.name} 完成`,
          detail: upcoming ? `下一站：${upcoming.template.name} @ ${upcoming.station.name}` : '全部步骤完成，可签出',
        },
  };
}

export function overrideBalance(data: Seed, p: { visitId: string; reason: string; approver: string }, ctx: Ctx): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit) return { data };
  const bal = stepsOf(data, visit, ctx).find((s) => s.template.isBalance && s.run?.status === 'in_progress');
  if (!bal?.run) return { data };
  let next = patchVisit(data, visit.id, (v) =>
    withLog(
      setRun(v, bal.key, { ...bal.run!, override: { by: p.approver, reason: p.reason, at: hm(ctx.now) } }),
      ctx.now,
      p.approver,
      `督导书面批准提前开始 T0：${p.reason}`,
      'warn',
    ),
  );
  next = resolveOpen(next, visit.id, 'balance_override', { ...ctx, actor: p.approver }, '批准提前（督导书面）');
  return { data: next, feedback: { tone: 'warn', title: '已批准提前开始', detail: '偏离已留痕' } };
}

// ---------- 入排 ----------

export function setAnswer(data: Seed, p: { visitId: string; criterionId: string; value: Answer }): CommandResult {
  return {
    data: {
      ...data,
      eligibility: data.eligibility.map((c) =>
        c.visitId === p.visitId ? { ...c, answers: { ...c.answers, [p.criterionId]: p.value } } : c,
      ),
    },
  };
}

export function decide(
  data: Seed,
  p: { visitId: string; outcome: 'enrolled' | 'screen_failed'; reason?: string; signer: string },
  ctx: Ctx,
): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit) return { data };
  const steps = stepsOf(data, visit, ctx);
  const gate = steps.find((s) => s.template.isGateAnchor);
  if (!gate) return { data };
  const subject = find(data.subjects, visit.subjectId);
  const rd = p.outcome === 'enrolled' ? nextRandomNo(data, visit.projectId) : undefined;
  const at = hm(ctx.now);

  let v = setRun(visit, gate.key, {
    status: 'done',
    start: at,
    end: at,
    operator: p.signer,
    result: p.outcome === 'enrolled' ? 'pass' : 'fail',
    values: rd ? { rd } : undefined,
    note: p.reason,
  });
  if (p.outcome === 'screen_failed') {
    for (const s of steps) {
      if (s.view === 'done' || s.key === gate.key) continue;
      v = setRun(v, s.key, { status: 'waived', note: '筛选失败，无需执行' });
    }
  }
  v = withLog(
    v,
    ctx.now,
    p.signer,
    p.outcome === 'enrolled' ? `入组判定：入组，随机号 ${rd}（电子签名）` : `入组判定：筛败（${p.reason}）（电子签名）`,
    p.outcome === 'enrolled' ? 'ok' : 'bad',
  );

  let next = patchVisit(data, visit.id, () => v);
  next = patchSubject(next, visit.subjectId, (s) => ({ ...s, status: p.outcome, rd: rd ?? s.rd }));
  next = {
    ...next,
    eligibility: next.eligibility.map((c) =>
      c.visitId === visit.id ? { ...c, decision: { outcome: p.outcome, reason: p.reason, by: p.signer, at, rd } } : c,
    ),
  };
  return {
    data: next,
    feedback:
      p.outcome === 'enrolled'
        ? { tone: 'ok', title: `${subject?.name} 入组 · 随机号 ${rd}`, detail: '已解锁产品发放与日记培训' }
        : { tone: 'warn', title: `${subject?.name} 筛选失败`, detail: '剩余步骤已免做，可直接签出' },
  };
}

// ---------- 出门 ----------

export function checkout(
  data: Seed,
  p: { visitId: string; outcome: CheckoutInfo['outcome']; reason?: string; nextAppointment?: string },
  ctx: Ctx,
): CommandResult {
  const visit = find(data.visits, p.visitId);
  if (!visit || visit.status === 'checked_out') return { data };
  const pending = stepsOf(data, visit, ctx).filter((s) => s.view !== 'done' && s.view !== 'waived');
  const at = hm(ctx.now);
  let v: TodayVisit = {
    ...settleBalances(data, visit, ctx),
    status: 'checked_out',
    checkout: { at, by: ctx.actor, outcome: p.outcome, reason: p.reason, nextAppointment: p.nextAppointment },
  };
  v = withLog(
    v,
    ctx.now,
    ctx.actor,
    p.outcome === 'complete'
      ? `签出${p.nextAppointment ? `，已预约下次 ${p.nextAppointment}` : ''}`
      : `未完成签出（${pending.length} 步未做）：${p.reason ?? ''}`,
    p.outcome === 'complete' ? 'ok' : 'warn',
  );
  let next = patchVisit(data, visit.id, () => v);
  next = patchSubject(next, visit.subjectId, (s) => {
    const idx = s.visits.findIndex((r) => r.code === visit.visitPoint);
    return {
      ...s,
      visits: s.visits.map((r, i) => {
        if (i === idx) return { ...r, state: 'done' };
        if (i === idx + 1 && p.nextAppointment) return { ...r, date: p.nextAppointment.slice(0, 10) };
        return r;
      }),
    };
  });
  next = resolveOpen(next, visit.id, 'mid_exit', ctx, '已签出');
  if (p.outcome === 'incomplete') {
    next = raise(next, {
      type: 'incomplete_checkout',
      visitId: visit.id,
      subjectId: visit.subjectId,
      raisedAt: at,
      raisedBy: ctx.actor,
      severity: 'medium',
      slaMinutes: 1440,
      title: `未完成签出：${pending.map((s) => s.template.short).join('、')} 待补做`,
      detail: p.reason ?? '',
      options: ['已安排窗口内补做', '记录方案偏离'],
    });
  }
  const subject = find(next.subjects, visit.subjectId);
  return {
    data: next,
    feedback: { tone: p.outcome === 'complete' ? 'ok' : 'warn', title: `${subject?.name} 已签出`, detail: p.nextAppointment ? `下次：${p.nextAppointment}` : undefined },
  };
}

// ---------- 异常 ----------

export function resolveException(data: Seed, p: { id: string; choice: string; note?: string }, ctx: Ctx): CommandResult {
  const ex = find(data.exceptions, p.id);
  if (!ex || ex.status !== 'open') return { data };
  let next: Seed = {
    ...data,
    exceptions: data.exceptions.map((e) =>
      e.id === ex.id ? { ...e, status: 'resolved', resolution: { by: ctx.actor, at: hm(ctx.now), choice: p.choice, note: p.note } } : e,
    ),
  };
  const visit = ex.visitId ? find(next.visits, ex.visitId) : undefined;
  const stepList = visit ? stepsOf(next, visit, ctx) : [];

  switch (ex.type) {
    case 'lactate_abnormal':
      if (!visit) break;
      if (p.choice.includes('继续')) {
        const lac = stepList.find((s) => s.template.id === 'lactate');
        const held = stepList.filter((s) => s.view === 'hold');
        next = patchVisit(next, visit.id, (v) => {
          let x = v;
          if (lac?.run) x = setRun(x, lac.key, { ...lac.run, result: 'pass', note: `${lac.run.note ?? ''}；医学判断可继续` });
          for (const h of held) x = setRun(x, h.key, undefined);
          return withLog(x, ctx.now, ctx.actor, '医学判断：可继续测量，已解除挂起', 'ok');
        });
      } else {
        return decide(next, { visitId: visit.id, outcome: 'screen_failed', reason: '乳酸刺痛异常，医学判断终止', signer: ctx.actor }, ctx);
      }
      break;
    case 'balance_override':
      if (visit && p.choice.includes('批准')) {
        return overrideBalance(next, { visitId: visit.id, reason: p.note || '测量室排程冲突', approver: ctx.actor }, ctx);
      }
      break;
    case 'mid_exit':
      if (!visit) break;
      if (p.choice.includes('今日返回')) {
        next = patchVisit(next, visit.id, (v) => withLog({ ...v, status: 'in_progress' }, ctx.now, ctx.actor, '受试者返回现场，继续访视', 'info'));
      } else {
        return checkout(next, { visitId: visit.id, outcome: 'incomplete', reason: `中途离开：${p.choice}` }, ctx);
      }
      break;
    case 'late':
      if (visit && p.choice.includes('缺席')) return markNoShow(next, { visitId: visit.id }, ctx);
      if (visit && p.choice.includes('放弃')) {
        next = patchVisit(next, visit.id, (v) => withLog({ ...v, status: 'cancelled' }, ctx.now, ctx.actor, '受试者放弃参加', 'bad'));
      }
      break;
    case 'rescreen':
      if (p.choice.includes('批准')) {
        const sc = nextScreeningNo(next, find(next.subjects, ex.subjectId)?.projectId ?? '');
        next = patchSubject(next, ex.subjectId, (s) => ({ ...s, status: 'prospect', sc }));
      }
      break;
    default:
      break;
  }
  return { data: next, feedback: { tone: 'ok', title: '异常已处置', detail: p.choice } };
}

// ---------- 导检编排 ----------

export function publishGuide(
  data: Seed,
  p: { projectId: string; visitPoint: string; steps: GuideStep[]; note: string; today: string },
  ctx: Ctx,
): CommandResult {
  const at = `${p.today} ${hm(ctx.now)}`;
  const guides = data.guides.map((g) => {
    if (g.projectId !== p.projectId || g.visitPoint !== p.visitPoint) return g;
    const version = g.version + 1;
    return {
      ...g,
      version,
      publishedAt: at,
      publishedBy: ctx.actor,
      steps: p.steps,
      snapshots: { ...g.snapshots, [g.version]: g.steps },
      history: [{ version, publishedAt: at, publishedBy: ctx.actor, note: p.note }, ...g.history],
    };
  });
  const g = guides.find((x) => x.projectId === p.projectId && x.visitPoint === p.visitPoint);
  return {
    data: { ...data, guides },
    feedback: { tone: 'ok', title: `已发布 ${p.visitPoint} 导检 V${g?.version}`, detail: '新签到的受试者按新版本执行' },
  };
}
