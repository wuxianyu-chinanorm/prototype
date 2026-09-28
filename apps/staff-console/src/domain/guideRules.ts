import type { GuideStep, StepTemplate, VisitPointDef } from './types';

/** 导检编排的发布前校验。纯函数，error 阻止发布，warn 只提示。 */

export interface RuleIssue {
  level: 'error' | 'warn';
  text: string;
  stepKey?: string;
}

export function validateGuide(steps: GuideStep[], templates: Map<string, StepTemplate>, point: VisitPointDef): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const t = (s: GuideStep) => templates.get(s.templateId);
  const gateIdx = steps.findIndex((s) => t(s)?.isGateAnchor);
  const consentIdx = steps.findIndex((s) => t(s)?.category === 'consent');

  if (steps.length === 0) issues.push({ level: 'error', text: '导检至少需要一个步骤' });

  if (point.kind === 'screening') {
    if (consentIdx !== 0) issues.push({ level: 'error', text: '筛选访视必须以「知情同意」开始：知情前不能做任何研究操作' });
    if (gateIdx < 0) issues.push({ level: 'error', text: '筛选访视缺少「入组判定」锚点' });
  }
  if (consentIdx >= 0 && t(steps[consentIdx + 1]!)?.category !== 'review') {
    issues.push({ level: 'warn', text: '建议在知情同意后紧跟「CRC 知情核对」' });
  }

  steps.forEach((s, i) => {
    const tpl = t(s);
    if (!tpl) return;
    if (tpl.requiresBalance && !steps.slice(0, i).some((x) => t(x)?.isBalance)) {
      issues.push({ level: 'error', text: `「${tpl.name}」之前必须有恒温平衡`, stepKey: s.key });
    }
    if (tpl.requiresEnrollment && point.kind === 'screening' && (gateIdx < 0 || i < gateIdx)) {
      issues.push({ level: 'error', text: `「${tpl.name}」必须在入组判定之后（产品先判后发）`, stepKey: s.key });
    }
    if (tpl.gateDim && gateIdx >= 0 && i > gateIdx) {
      issues.push({ level: 'error', text: `「${tpl.name}」是入组证据，必须放在锚点之前`, stepKey: s.key });
    }
    if (tpl.isBalance && !steps.slice(0, i).some((x) => t(x)?.category === 'skin_prep')) {
      issues.push({ level: 'warn', text: '平衡前通常需要先标准洁面', stepKey: s.key });
    }
  });

  const lac = steps.findIndex((s) => t(s)?.id === 'lactate');
  const meas = steps.findIndex((s) => t(s)?.category === 'device');
  if (lac >= 0 && meas >= 0 && lac > meas) {
    issues.push({ level: 'warn', text: '乳酸刺痛建议放在仪器测量之前，异常时可提前挂起测量' });
  }

  const seen = new Set<string>();
  for (const s of steps) {
    if (seen.has(s.templateId)) issues.push({ level: 'warn', text: `「${t(s)?.name}」出现了多次`, stepKey: s.key });
    seen.add(s.templateId);
  }
  return issues;
}

export interface GuideDiff {
  added: string[];
  removed: string[];
  moved: string[];
  retimed: string[];
}

export function diffGuide(before: GuideStep[], after: GuideStep[]): GuideDiff {
  const bIdx = new Map(before.map((s, i) => [s.key, i]));
  const aKeys = new Set(after.map((s) => s.key));
  const bMap = new Map(before.map((s) => [s.key, s]));
  const common = after.filter((s) => bIdx.has(s.key)).map((s) => s.key);
  const commonBefore = before.filter((s) => aKeys.has(s.key)).map((s) => s.key);
  return {
    added: after.filter((s) => !bIdx.has(s.key)).map((s) => s.key),
    removed: before.filter((s) => !aKeys.has(s.key)).map((s) => s.key),
    moved: common.filter((k, i) => commonBefore[i] !== k),
    retimed: after.filter((s) => bMap.has(s.key) && bMap.get(s.key)!.minutes !== s.minutes).map((s) => s.key),
  };
}

export const diffCount = (d: GuideDiff) => d.added.length + d.removed.length + d.moved.length + d.retimed.length;
