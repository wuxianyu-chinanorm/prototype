import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, CircleHelp, CircleX, FileCheck2, PenLine, Scale } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { useVisitContexts, type VisitContext } from '../../store/selectors';
import { DIM_LABEL, gateDimensions, gateStep } from '../../domain/visitEngine';
import type { Answer, Criterion, EligibilityCase } from '../../domain/types';
import { Avatar, Badge, Button, Card, CardHeader, Empty, Field, PageHeader, inputCls, cx } from '../../ui/kit';
import { Modal } from '../../ui/overlay';
import { ProjectChip, StepChain } from '../../ui/visit';
import type { Intent } from '../../ui/tone';

type CaseStatus = { label: string; intent: Intent; rank: number };

function caseStatus(c: VisitContext): CaseStatus {
  const g = gateStep(c.steps);
  if (g?.run?.status === 'done') return g.run.result === 'pass' ? { label: '已入组', intent: 'ok', rank: 3 } : { label: '筛败', intent: 'bad', rank: 4 };
  if (c.steps.some((s) => s.template.category === 'consent' && s.view === 'failed')) return { label: '已终止', intent: 'neutral', rank: 5 };
  if (g?.view === 'ready') return { label: '待 PI 判定', intent: 'warn', rank: 0 };
  if (c.steps.some((s) => s.beforeGate && s.view === 'hold')) return { label: '挂起中', intent: 'warn', rank: 1 };
  return { label: '证据收集中', intent: 'info', rank: 2 };
}

const ok = (c: Criterion, a: Answer) => (a === null ? null : c.kind === 'inclusion' ? a === 'yes' : a === 'no');

export function EligibilityPage() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { data } = useStore();
  const ctxs = useVisitContexts()
    .filter((c) => gateStep(c.steps) && c.visit.checkin)
    .sort((a, b) => caseStatus(a).rank - caseStatus(b).rank);
  const sel = ctxs.find((c) => c.visit.id === visitId) ?? ctxs[0];

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader title="入排判定" sub="入选标准全部为「是」、排除标准全部为「否」，并由 PI 电子签名" />
      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-5">
        <Card {...tourAnchor('elig-list')}>
          <CardHeader title="今日筛选" sub={`${ctxs.length} 人`} icon={<Scale className="size-4" />} />
          <div className="space-y-1.5 px-3 pb-3">
            {ctxs.map((c) => {
              const st = caseStatus(c);
              const dims = gateDimensions(c.steps);
              return (
                <button
                  key={c.visit.id}
                  type="button"
                  onClick={() => navigate(`/eligibility/${c.visit.id}`)}
                  className={cx('flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 transition', sel?.visit.id === c.visit.id ? 'bg-slate-900 text-white ring-slate-900' : 'ring-transparent hover:bg-slate-50 hover:ring-slate-200')}
                >
                  <Avatar name={c.subject.name} hue={c.subject.hue} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium">{c.subject.name}</span>
                      <span className={cx('font-mono text-[11px]', sel?.visit.id === c.visit.id ? 'text-slate-400' : 'text-slate-400')}>{c.subject.sc}</span>
                    </div>
                    <div className={cx('mt-0.5 text-[11.5px]', sel?.visit.id === c.visit.id ? 'text-slate-400' : 'text-slate-500')}>
                      {c.project.id} · 维度 {dims.filter((d) => d.state === 'pass').length}/{dims.length} 通过
                    </div>
                  </div>
                  <Badge intent={st.intent}>{st.label}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {sel ? (
          <CasePanel key={sel.visit.id} ctx={sel} criteria={data.criteria[sel.project.id] ?? []} kase={data.eligibility.find((e) => e.visitId === sel.visit.id)} />
        ) : (
          <Card>
            <Empty icon={<Scale className="size-5" />} title="今天没有筛选访视" />
          </Card>
        )}
      </div>
    </div>
  );
}

const REASONS = ['不满足入选标准', '符合排除标准', '乳酸刺痛异常', '测量值不达标', '受试者自愿退出', '研究者判断不适合'];

function CasePanel({ ctx, criteria, kase }: { ctx: VisitContext; criteria: Criterion[]; kase?: EligibilityCase }) {
  const { data, actions } = useStore();
  const dims = gateDimensions(ctx.steps);
  const gate = gateStep(ctx.steps);
  const decided = gate?.run?.status === 'done';
  const answers = kase?.answers ?? {};
  const results = criteria.map((c) => ({ c, a: answers[c.id] ?? null, ok: ok(c, answers[c.id] ?? null) }));
  const unanswered = results.filter((r) => r.ok === null);
  const failing = results.filter((r) => r.ok === false);
  const evidenceReady = gate?.view === 'ready';
  const canEnroll = evidenceReady && unanswered.length === 0 && failing.length === 0;
  const [sign, setSign] = useState<'enrolled' | 'screen_failed' | null>(null);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Avatar name={ctx.subject.name} hue={ctx.subject.hue} size={48} />
          <div>
            <div className="flex items-center gap-2 text-[18px] font-semibold text-slate-900">
              {ctx.subject.name}
              <span className="font-mono text-[12px] font-normal text-slate-400">{ctx.subject.sc}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12.5px] text-slate-500">
              <ProjectChip project={ctx.project} visitPoint={ctx.visit.visitPoint} />
              {ctx.project.name} · PI {ctx.project.pi}
            </div>
          </div>
          <div className="ml-auto">
            <StepChain steps={ctx.steps} />
          </div>
        </div>
        <div className="grid grid-cols-6 gap-2 border-t border-slate-100 p-4" {...tourAnchor('elig-evidence')}>
          {dims.map((d) => (
            <div key={d.dim} className={cx('rounded-xl px-3 py-2 ring-1', d.state === 'pass' ? 'bg-emerald-50 ring-emerald-200' : d.state === 'fail' ? 'bg-rose-50 ring-rose-200' : d.state === 'hold' ? 'bg-amber-50 ring-amber-200' : 'bg-slate-50 ring-slate-200')}>
              <div className="text-[12px] font-medium text-slate-800">{DIM_LABEL[d.dim]}</div>
              <div className="text-[11px] text-slate-500">{d.steps.map((s) => s.template.short).join(' · ')}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card {...tourAnchor('elig-criteria')}>
        <CardHeader title="入排标准逐条确认" sub="证据来自现场步骤记录；PI 可修正回答" icon={<FileCheck2 className="size-4" />} />
        {(['inclusion', 'exclusion'] as const).map((kind) => (
          <div key={kind} className="px-5 pb-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-slate-500">
              {kind === 'inclusion' ? '入选标准 · 需全部为「是」' : '排除标准 · 需全部为「否」'}
            </div>
            <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
              {results
                .filter((r) => r.c.kind === kind)
                .map(({ c, a, ok: good }) => (
                  <div key={c.id} className={cx('grid grid-cols-[44px_minmax(0,1fr)_200px_132px] items-center gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0', good === false && 'bg-rose-50/60')}>
                    <span className="font-mono text-[12px] font-semibold text-slate-400">{c.id}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] text-slate-800">{c.text}</div>
                      <div className="text-[11px] text-slate-400">来源：{DIM_LABEL[c.source]}</div>
                    </div>
                    <div className="truncate text-[12px] text-slate-600">{kase?.evidence[c.id] ?? '—'}</div>
                    <div className="flex items-center justify-end gap-1.5">
                      {(['yes', 'no'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          disabled={decided}
                          onClick={() => actions.setAnswer(ctx.visit.id, c.id, a === v ? null : v)}
                          className={cx('h-7 w-10 rounded-lg text-[12px] font-medium ring-1 transition disabled:opacity-60', a === v ? (good ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-rose-500 text-white ring-rose-500') : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300')}
                        >
                          {v === 'yes' ? '是' : '否'}
                        </button>
                      ))}
                      {good === null ? <CircleHelp className="size-4 text-slate-300" /> : good ? <CircleCheck className="size-4 text-emerald-500" /> : <CircleX className="size-4 text-rose-500" />}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-5" {...tourAnchor('elig-decision')}>
        {decided ? (
          <div className="flex items-center gap-3">
            {gate?.run?.result === 'pass' ? <CircleCheck className="size-7 text-emerald-500" /> : <CircleX className="size-7 text-rose-500" />}
            <div>
              <div className="text-[16px] font-semibold text-slate-900">{gate?.run?.result === 'pass' ? `已入组 · 随机号 ${gate.run.values?.rd}` : `筛选失败 · ${gate?.run?.note ?? ''}`}</div>
              <div className="text-[12.5px] text-slate-500">
                {gate?.run?.operator} 于 {gate?.run?.end} 电子签名
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-slate-900">
                {!evidenceReady ? '证据未齐，暂不能判定' : canEnroll ? '满足入组条件' : failing.length ? `${failing.length} 条标准不满足` : `还有 ${unanswered.length} 条未确认`}
              </div>
              <div className="mt-0.5 text-[12.5px] text-slate-500">
                {!evidenceReady
                  ? `锚点前还有步骤未完成：${ctx.steps.filter((s) => s.beforeGate && s.view !== 'done').map((s) => s.template.short).join('、')}`
                  : failing.length
                    ? failing.map((f) => f.c.id).join('、') + ' 不满足 → 只能判定筛败'
                    : '入组后将分配随机号并解锁产品发放'}
              </div>
            </div>
            <Button variant="danger" disabled={!evidenceReady && failing.length === 0} onClick={() => setSign('screen_failed')}>
              判定筛败
            </Button>
            <Button variant="primary" disabled={!canEnroll} onClick={() => setSign('enrolled')}>
              <PenLine className="size-4" />
              判定入组并签名
            </Button>
          </div>
        )}
      </Card>

      {sign && (
        <SignModal
          outcome={sign}
          defaultReason={failing[0]?.c.kind === 'exclusion' ? '符合排除标准' : failing.length ? '不满足入选标准' : REASONS[0]!}
          signers={data.site.people.filter((p) => p.canSign).map((p) => p.name)}
          defaultSigner={ctx.project.pi}
          onClose={() => setSign(null)}
          onSign={(signer, reason) => {
            actions.decide(ctx.visit.id, sign, signer, sign === 'screen_failed' ? reason : undefined);
            setSign(null);
          }}
        />
      )}
    </div>
  );
}

function SignModal({ outcome, signers, defaultSigner, defaultReason, onClose, onSign }: {
  outcome: 'enrolled' | 'screen_failed'; signers: string[]; defaultSigner: string; defaultReason: string; onClose(): void; onSign(signer: string, reason: string): void;
}) {
  const [signer, setSigner] = useState(signers.includes(defaultSigner) ? defaultSigner : signers[0] ?? '');
  const [reason, setReason] = useState(defaultReason);
  const [pin, setPin] = useState('');
  return (
    <Modal
      open
      onClose={onClose}
      title={outcome === 'enrolled' ? '电子签名 · 判定入组' : '电子签名 · 判定筛败'}
      sub="签名含义：本人已审阅上述全部证据，并对判定结果负责。"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant={outcome === 'enrolled' ? 'primary' : 'danger'} disabled={pin.length < 4} onClick={() => onSign(signer, reason)}>
            <PenLine className="size-4" />
            签名确认
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="签名人（研究者）">
          <select className={inputCls} value={signer} onChange={(e) => setSigner(e.target.value)}>
            {signers.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        {outcome === 'screen_failed' && (
          <Field label="筛败原因">
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className={cx('rounded-lg px-3 py-2 text-left text-[13px] ring-1', r === reason ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200')}>
                  {r}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="签名 PIN" hint="原型中任意 4 位数字即可">
          <input className={cx(inputCls, 'font-mono tracking-[.4em]')} value={pin} maxLength={6} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" />
        </Field>
      </div>
    </Modal>
  );
}
