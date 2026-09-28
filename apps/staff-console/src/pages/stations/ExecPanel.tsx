import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CircleCheck, CircleDashed, CircleX, Lock, Play, Scale, ShieldAlert, TimerReset } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import type { VisitContext } from '../../store/selectors';
import { humanMinutes, mmss } from '../../domain/time';
import type { BlockerCode, ResolvedStep } from '../../domain/visitEngine';
import type { Station } from '../../domain/types';
import { Avatar, Badge, Button, Card, Field, inputCls, Ring, cx } from '../../ui/kit';
import { ProjectChip, VIEW } from '../../ui/visit';
import { StepIcon } from '../../ui/icons';
import { OverrideModal } from './OverrideModal';

const PERFORMER = { staff: '工作人员操作', subject: '受试者自助', both: '双方共同完成' } as const;

interface Check {
  label: string;
  ok: boolean;
  detail?: string;
}

function gateChecks(step: ResolvedStep, ctx: VisitContext, activeCount: number, capacity: number): Check[] {
  const has = (code: BlockerCode) => step.blockers.find((b) => b.code === code);
  const list: Check[] = [{ label: '已签到并在场', ok: !has('checkin') && !has('paused') && !has('closed') }];
  const hasConsent = ctx.steps.some((s) => s.template.category === 'consent');
  if (hasConsent && step.template.category !== 'consent' && step.template.category !== 'review') {
    list.push({ label: '知情同意已完成', ok: !has('consent'), detail: has('consent')?.text });
  }
  if (step.index > 0) list.push({ label: '前序步骤已完成', ok: !has('previous'), detail: has('previous')?.text });
  if (step.template.requiresBalance) list.push({ label: '平衡时间已满', ok: !has('balance'), detail: has('balance')?.text });
  if (step.template.requiresEnrollment) list.push({ label: '已判定入组', ok: !has('enrollment'), detail: has('enrollment')?.text });
  if (step.view === 'ready') list.push({ label: '工位有空位', ok: activeCount < capacity, detail: `${activeCount}/${capacity}` });
  if (step.view === 'hold') list.push({ label: '无挂起', ok: false, detail: step.run?.note });
  return list;
}

export function ExecPanel({ ctx, step, station, activeCount }: { ctx: VisitContext; step: ResolvedStep; station: Station; activeCount: number }) {
  const { actions } = useStore();
  const navigate = useNavigate();
  const t = step.template;
  const checks = gateChecks(step, ctx, activeCount, station.capacity);
  const allOk = checks.every((c) => c.ok);
  const [ticks, setTicks] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<'pass' | 'fail'>('pass');
  const [score, setScore] = useState<string>('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [override, setOverride] = useState(false);

  const balanceBlock = step.blockers.find((b) => b.code === 'balance');
  const balanceStep = [...ctx.steps.slice(0, step.index)].reverse().find((s) => s.template.isBalance);
  const operatorFor = station.staff[0];

  const canComplete =
    step.view === 'active' &&
    (t.resultKind !== 'score' || score !== '') &&
    (t.resultKind !== 'measure' || (t.measures ?? []).every((m) => values[m.key]));

  const complete = () => {
    const payload =
      t.resultKind === 'score'
        ? { values: { score }, note }
        : t.resultKind === 'measure'
          ? { values, note, result: 'pass' as const }
          : t.resultKind === 'passfail'
            ? { result, note }
            : { note };
    actions.completeStep(ctx.visit.id, step.key, payload, operatorFor);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 px-6 py-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <Avatar name={ctx.subject.name} hue={ctx.subject.hue} size={48} ring />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-semibold">{ctx.subject.name}</span>
              <span className="rounded bg-white/15 px-1.5 font-mono text-[11px]">{ctx.visit.checkin?.no}</span>
              <span className="text-[12px] text-slate-400">
                {ctx.subject.gender} · {ctx.subject.age} · {ctx.subject.skinType}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[12px] text-slate-300">
              <span className="rounded-md bg-white/10 px-1.5 py-0.5">
                {ctx.project.id} · {ctx.visit.visitPoint}
              </span>
              {ctx.subject.rd && <span className="font-mono">随机号 {ctx.subject.rd}</span>}
              <span>
                第 {step.index + 1} / {ctx.total} 步
              </span>
            </div>
          </div>
          <Badge intent={VIEW[step.view].intent} dot>
            {VIEW[step.view].label}
          </Badge>
        </div>
        <div className="relative mt-5 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <StepIcon name={t.icon} className="size-6 text-teal-300" />
          </div>
          <div>
            <div className="text-[22px] font-semibold tracking-tight">{t.name}</div>
            <div className="text-[12.5px] text-slate-400">
              标准 {step.minutes} 分钟 · {PERFORMER[t.performer]} · {station.name}
            </div>
          </div>
          {step.view === 'active' && step.elapsedSec !== undefined && !t.isBalance && (
            <div className="ml-auto text-right">
              <div className={cx('font-mono text-[26px] font-semibold tabular-nums', step.elapsedSec / 60 > step.minutes ? 'text-rose-300' : 'text-white')}>{mmss(step.elapsedSec)}</div>
              <div className="text-[11px] text-slate-400">已进行</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6">
        <div {...tourAnchor('gate-checks')}>
          <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">门禁检查</div>
          <div className="space-y-1.5">
            {checks.map((c) => (
              <div key={c.label} className={cx('flex items-center gap-2.5 rounded-xl px-3 py-2.5 ring-1', c.ok ? 'bg-emerald-50/60 ring-emerald-200/70' : 'bg-rose-50/60 ring-rose-200/70')}>
                {c.ok ? <CircleCheck className="size-4 text-emerald-500" /> : <Lock className="size-4 text-rose-500" />}
                <span className="text-[13px] font-medium text-slate-800">{c.label}</span>
                {c.detail && <span className={cx('ml-auto text-[11.5px]', c.ok ? 'text-slate-500' : 'text-rose-600')}>{c.detail}</span>}
              </div>
            ))}
          </div>

          <div className="mt-5 mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">操作要点</div>
          <div className="space-y-1">
            {t.checklist.map((item, i) => (
              <button key={item} type="button" onClick={() => setTicks((x) => ({ ...x, [i]: !x[i] }))} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-50">
                {ticks[i] ? <CircleCheck className="size-4 text-teal-500" /> : <CircleDashed className="size-4 text-slate-300" />}
                <span className={cx(ticks[i] && 'text-slate-400 line-through')}>{item}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          {t.isBalance && step.view === 'active' ? (
            <BalanceTimer step={step} onOverride={() => setOverride(true)} />
          ) : t.isGateAnchor ? (
            <div className="rounded-2xl bg-rose-50/60 p-5 ring-1 ring-rose-200/70">
              <Scale className="size-6 text-rose-500" />
              <div className="mt-3 text-[15px] font-semibold text-slate-900">入组判定在入排页完成</div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">锚点之前的证据齐了之后，由 PI 逐条确认入排标准并电子签名。这里只显示结果。</p>
              <Button className="mt-4" variant="dark" disabled={step.view !== 'ready'} onClick={() => navigate(`/eligibility/${ctx.visit.id}`)}>
                去判定
              </Button>
            </div>
          ) : step.view === 'active' ? (
            <div className="space-y-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">录入结果</div>
              {t.resultKind === 'passfail' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['pass', 'fail'] as const).map((r) => (
                    <button key={r} type="button" onClick={() => setResult(r)} className={cx('flex h-14 items-center justify-center gap-2 rounded-xl text-[14px] font-medium ring-1 transition', result === r ? (r === 'pass' ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-rose-500 text-white ring-rose-500') : 'bg-white text-slate-600 ring-slate-200')}>
                      {r === 'pass' ? <CircleCheck className="size-4" /> : <CircleX className="size-4" />}
                      {r === 'pass' ? '通过' : '不通过'}
                    </button>
                  ))}
                </div>
              )}
              {t.resultKind === 'score' && (
                <Field label="刺痛评分（5 分钟）" hint="0 无 · 1 轻微 · 2 中度 · 3 重度；≥2 自动挂起后续测量">
                  <div className="grid grid-cols-4 gap-2">
                    {['0', '1', '2', '3'].map((v) => (
                      <button key={v} type="button" onClick={() => setScore(v)} className={cx('h-12 rounded-xl font-mono text-lg font-semibold ring-1 transition', score === v ? (Number(v) >= 2 ? 'bg-amber-500 text-white ring-amber-500' : 'bg-teal-500 text-white ring-teal-500') : 'bg-white text-slate-600 ring-slate-200')}>
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              {t.resultKind === 'measure' && (
                <div className="grid grid-cols-2 gap-3">
                  {(t.measures ?? []).map((m) => (
                    <Field key={m.key} label={`${m.label}（${m.unit}）`}>
                      <input className={cx(inputCls, 'font-mono')} inputMode="decimal" value={values[m.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))} placeholder="0.0" />
                    </Field>
                  ))}
                </div>
              )}
              <Field label="备注（可选）">
                <textarea className={cx(inputCls, 'h-16 py-2')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：左颊轻度泛红" />
              </Field>
              <Button variant="primary" size="lg" className="w-full" disabled={!canComplete} onClick={complete}>
                <Check className="size-4" />
                完成「{t.short}」
              </Button>
            </div>
          ) : step.view === 'ready' ? (
            <div className="flex h-full flex-col justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-white p-6 ring-1 ring-teal-200/70">
              <div className="text-[15px] font-semibold text-slate-900">可以开始</div>
              <p className="mt-1 text-[13px] text-slate-600">
                受试者手机上显示：「{t.subjectCopy}」
              </p>
              <Button variant="primary" size="lg" className="mt-5" disabled={!allOk} onClick={() => actions.startStep(ctx.visit.id, step.key, t.performer === 'subject' ? undefined : operatorFor)}>
                <Play className="size-4" />
                开始 {t.short}
              </Button>
              <div className="mt-2 text-center text-[11.5px] text-slate-400">预计 {humanMinutes(step.minutes)}</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                <Lock className="size-4 text-slate-400" />
                {step.view === 'hold' ? '已挂起' : '暂不能开始'}
              </div>
              <p className="mt-1 text-[13px] text-slate-600">{step.view === 'hold' ? step.run?.note : step.blockers.map((b) => b.text).join('；')}</p>
              {balanceBlock && balanceStep?.balanceRemainSec !== undefined && (
                <Button className="mt-4" onClick={() => setOverride(true)}>
                  <TimerReset className="size-4" />
                  申请提前开始（需督导）
                </Button>
              )}
              {step.view === 'hold' && (
                <Button className="mt-4" variant="dark" onClick={() => navigate('/exceptions')}>
                  <ShieldAlert className="size-4" />
                  去异常中心处理
                </Button>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-[11.5px] text-slate-400">
            <ProjectChip project={ctx.project} visitPoint={ctx.visit.visitPoint} />
            导检 V{ctx.visit.guideVersion} · 完成态只能在本工位写入
          </div>
        </div>
      </div>
      {override && (
        <OverrideModal
          visitId={ctx.visit.id}
          remainSec={(t.isBalance ? step.balanceRemainSec : balanceStep?.balanceRemainSec) ?? 0}
          onClose={() => setOverride(false)}
        />
      )}
    </Card>
  );
}

function BalanceTimer({ step, onOverride }: { step: ResolvedStep; onOverride(): void }) {
  const remain = step.balanceRemainSec ?? 0;
  const total = step.minutes * 60;
  return (
    <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-teal-50 to-white p-6 ring-1 ring-teal-200/70">
      <Ring value={total - remain} max={total} size={168} stroke={10} color="#14b8a6">
        <div className="text-center">
          <div className="font-mono text-[34px] font-semibold tabular-nums text-slate-900">{mmss(remain)}</div>
          <div className="text-[11.5px] text-slate-500">平衡剩余</div>
        </div>
      </Ring>
      <div className="mt-4 text-center text-[13px] text-slate-600">计时结束自动完成，受试者手机会提醒前往下一站。</div>
      {step.run?.override ? (
        <Badge intent="warn" className="mt-3">
          已由 {step.run.override.by} 批准提前
        </Badge>
      ) : (
        <Button className="mt-4" onClick={onOverride}>
          <TimerReset className="size-4" />
          申请提前结束（需督导）
        </Button>
      )}
    </div>
  );
}
