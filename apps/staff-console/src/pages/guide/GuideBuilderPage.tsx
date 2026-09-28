import { Fragment, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CircleAlert, CircleCheck, GripVertical, History, Plus, Rocket, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { diffCount, diffGuide, validateGuide } from '../../domain/guideRules';
import { humanMinutes } from '../../domain/time';
import { DIM_LABEL } from '../../domain/visitEngine';
import type { GuideStep, Project, PublishedGuide, StepCategory, StepTemplate } from '../../domain/types';
import { Badge, Button, Card, CardHeader, Field, PageHeader, Segmented, inputCls, cx } from '../../ui/kit';
import { Modal } from '../../ui/overlay';
import { StepIcon } from '../../ui/icons';
import { toneSolid } from '../../ui/tone';

const CATEGORY: Record<StepCategory, string> = {
  consent: '知情', review: '知情', interview: '问诊', questionnaire: '问卷', skin_prep: '皮肤准备', provocation: '激发测试',
  wait: '等待', device: '仪器', imaging: '影像', assessment: '评估', gate: '判定', product: '产品', diary: '日记', safety: '安全', closeout: '出组',
};

export function GuideBuilderPage() {
  const { data } = useStore();
  const [projectId, setProjectId] = useState(data.projects[0]!.id);
  const project = data.projects.find((p) => p.id === projectId)!;
  const [vp, setVp] = useState(project.visitPlan[0]!.code);
  const guide = data.guides.find((g) => g.projectId === projectId && g.visitPoint === vp);

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader title="导检编排" sub="为每个项目、每个访视点编排并发布导检；现场只按已发布版本执行" />
      <div className="mb-5 flex flex-wrap items-center gap-3" {...tourAnchor('guide-scope')}>
        <Segmented
          value={projectId}
          onChange={(v) => {
            setProjectId(v);
            setVp('V1');
          }}
          options={data.projects.map((p) => ({ value: p.id, label: <><span className={cx('size-1.5 rounded-full', toneSolid[p.tone])} />{p.id} {p.name.slice(0, 6)}</> }))}
        />
        <Segmented value={vp} onChange={setVp} options={project.visitPlan.map((v) => ({ value: v.code, label: `${v.code} · ${v.name}` }))} />
      </div>
      {guide ? <Builder key={`${projectId}-${vp}-${guide.version}`} project={project} guide={guide} /> : <Card className="p-8 text-sm text-slate-500">该访视点尚未创建导检</Card>}
    </div>
  );
}

function Builder({ project, guide }: { project: Project; guide: PublishedGuide }) {
  const { data, catalog, actions } = useStore();
  const point = project.visitPlan.find((v) => v.code === guide.visitPoint)!;
  const [draft, setDraft] = useState<GuideStep[]>(guide.steps);
  const [sel, setSel] = useState<string | null>(draft[0]?.key ?? null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  const issues = useMemo(() => validateGuide(draft, catalog.templates, point), [draft, catalog, point]);
  const diff = useMemo(() => diffGuide(guide.steps, draft), [guide.steps, draft]);
  const errors = issues.filter((i) => i.level === 'error');
  const dirty = diffCount(diff) > 0;
  const total = draft.reduce((s, x) => s + (x.minutes ?? catalog.templates.get(x.templateId)?.standardMinutes ?? 0), 0);
  const selStep = draft.find((s) => s.key === sel);
  const selTpl = selStep && catalog.templates.get(selStep.templateId);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.length || from === to) return;
    const next = [...draft];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x!);
    setDraft(next);
  };
  const add = (tpl: StepTemplate) => {
    let key = tpl.id;
    for (let n = 2; draft.some((s) => s.key === key); n++) key = `${tpl.id}-${n}`;
    const at = sel ? draft.findIndex((s) => s.key === sel) + 1 : draft.length;
    const next = [...draft];
    next.splice(at, 0, { key, templateId: tpl.id, minutes: tpl.isBalance ? tpl.standardMinutes : undefined });
    setDraft(next);
    setSel(key);
  };

  const groups = data.templates.reduce<Record<string, StepTemplate[]>>((acc, t) => {
    (acc[CATEGORY[t.category]] ??= []).push(t);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-5 py-3 ring-1 ring-slate-200/70" {...tourAnchor('guide-version')}>
        <Badge intent="ok" dot>
          已发布 V{guide.version}
        </Badge>
        <span className="text-[13px] text-slate-500">
          {guide.publishedAt} · {guide.publishedBy}
        </span>
        {dirty ? (
          <Badge intent="warn">草稿 · {diffCount(diff)} 处修改未发布</Badge>
        ) : (
          <span className="text-[12.5px] text-slate-400">草稿与已发布一致</span>
        )}
        <span className="text-[12.5px] text-slate-500">
          · {draft.length} 步 · 约 {humanMinutes(total)}
        </span>
        <div className="ml-auto flex items-center gap-2" {...tourAnchor('guide-publish')}>
          <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => setDraft(guide.steps)}>
            <RotateCcw className="size-3.5" />
            还原
          </Button>
          <Button size="sm" variant="primary" disabled={!dirty || errors.length > 0} onClick={() => setPublishing(true)}>
            <Rocket className="size-3.5" />
            发布为 V{guide.version + 1}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[250px_minmax(0,1fr)_340px] gap-5">
        <Card {...tourAnchor('guide-library')} className="self-start">
          <CardHeader title="步骤库" sub="点击添加到选中步骤之后" />
          <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto px-3 pb-4 scroll-thin">
            {Object.entries(groups).map(([g, list]) => (
              <div key={g}>
                <div className="px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">{g}</div>
                {list.map((t) => (
                  <button key={t.id} type="button" onClick={() => add(t)} className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-slate-700 hover:bg-slate-50">
                    <StepIcon name={t.icon} className="size-4 text-slate-400" />
                    <span className="flex-1 truncate">{t.name}</span>
                    <Plus className="size-3.5 text-slate-300 group-hover:text-teal-600" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card {...tourAnchor('guide-canvas')}>
          <CardHeader title={`${guide.visitPoint} · ${point.name}`} sub={`D${point.day}${point.minus || point.plus ? ` ±${point.plus}` : ''} · 拖动或用箭头调整顺序`} />
          <div className="px-5 pb-5">
            {draft.map((s, i) => {
              const t = catalog.templates.get(s.templateId);
              if (!t) return null;
              const st = catalog.stations.get(t.stationId);
              const err = issues.some((x) => x.stepKey === s.key && x.level === 'error');
              const isNew = diff.added.includes(s.key);
              return (
                <Fragment key={s.key}>
                  {t.isGateAnchor && (
                    <div className="my-2 flex items-center gap-2 text-[11px] font-semibold text-rose-600">
                      <div className="h-px flex-1 bg-rose-200" />▲ 入组判定锚点：以上为筛选证据
                      <div className="h-px flex-1 bg-rose-200" />
                    </div>
                  )}
                  <div
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIdx !== null) move(dragIdx, i);
                      setDragIdx(null);
                    }}
                    onClick={() => setSel(s.key)}
                    className={cx(
                      'group mb-2 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition',
                      sel === s.key ? 'bg-teal-50/60 ring-2 ring-teal-400' : err ? 'bg-rose-50/50 ring-rose-300' : 'bg-white ring-slate-200 hover:ring-slate-300',
                      dragIdx === i && 'opacity-40',
                    )}
                  >
                    <GripVertical className="size-4 cursor-grab text-slate-300" />
                    <span className="w-5 text-right font-mono text-[12px] text-slate-400">{i + 1}</span>
                    <div className={cx('grid size-8 place-items-center rounded-lg', t.isGateAnchor ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600')}>
                      <StepIcon name={t.icon} className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-slate-900">
                        {t.name}
                        {isNew && <Badge intent="brand">新增</Badge>}
                        {diff.moved.includes(s.key) && <Badge intent="warn">已移动</Badge>}
                      </div>
                      <div className="text-[11.5px] text-slate-500">
                        {st?.name} · {s.minutes ?? t.standardMinutes} 分钟
                      </div>
                    </div>
                    <div className="hidden items-center gap-1 xl:flex">
                      {t.gateDim && <Badge intent="violet">{DIM_LABEL[t.gateDim]}</Badge>}
                      {t.requiresBalance && <Badge intent="info">需平衡</Badge>}
                      {t.requiresEnrollment && <Badge intent="neutral">需入组</Badge>}
                      {t.performer === 'subject' && <Badge intent="info">自助</Badge>}
                    </div>
                    <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                      <button type="button" className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" onClick={(e) => (e.stopPropagation(), move(i, i - 1))}>
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" onClick={(e) => (e.stopPropagation(), move(i, i + 1))}>
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button type="button" className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={(e) => (e.stopPropagation(), setDraft(draft.filter((x) => x.key !== s.key)))}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card {...tourAnchor('guide-rules')}>
            <CardHeader title="规则校验" sub={errors.length ? `${errors.length} 个错误阻止发布` : '可以发布'} icon={errors.length ? <CircleAlert className="size-4 text-rose-500" /> : <CircleCheck className="size-4 text-emerald-500" />} />
            <div className="space-y-1.5 px-4 pb-4">
              {issues.length === 0 && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-700">全部规则通过</div>}
              {issues.map((x, i) => (
                <div key={i} className={cx('flex items-start gap-2 rounded-lg px-3 py-2 text-[12.5px]', x.level === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800')}>
                  {x.level === 'error' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> : <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />}
                  {x.text}
                </div>
              ))}
            </div>
          </Card>

          {selStep && selTpl && (
            <Card>
              <CardHeader title={selTpl.name} sub={`${catalog.stations.get(selTpl.stationId)?.name} · ${CATEGORY[selTpl.category]}`} icon={<StepIcon name={selTpl.icon} className="size-4" />} />
              <div className="space-y-4 px-5 pb-5">
                <Field label="时长（分钟）" hint={selTpl.isBalance ? '平衡时长按方案设置；未满不能开始测量' : `标准 ${selTpl.standardMinutes} 分钟`}>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={selStep.minutes ?? selTpl.standardMinutes}
                    onChange={(e) => setDraft(draft.map((s) => (s.key === selStep.key ? { ...s, minutes: Number(e.target.value) || undefined } : s)))}
                  />
                </Field>
                <div>
                  <div className="mb-1.5 text-xs font-medium text-slate-600">受试者手机上看到</div>
                  <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-sky-700 p-4 text-white shadow-[0_12px_30px_-12px_rgba(13,148,136,.7)]">
                    <div className="text-[11px] opacity-80">下一站 · {catalog.stations.get(selTpl.stationId)?.name}</div>
                    <div className="mt-1 text-[16px] font-semibold">{selTpl.name}</div>
                    <div className="mt-1.5 text-[12.5px] leading-relaxed opacity-90">{selTpl.subjectCopy}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="版本历史" icon={<History className="size-4" />} />
            <div className="space-y-2 px-5 pb-5">
              {guide.history.map((h) => (
                <div key={h.version} className="flex gap-3 text-[12.5px]">
                  <span className={cx('mt-0.5 h-fit rounded-md px-1.5 font-mono text-[11px] font-semibold', h.version === guide.version ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>V{h.version}</span>
                  <div>
                    <div className="text-slate-700">{h.note}</div>
                    <div className="text-[11px] text-slate-400">
                      {h.publishedAt} · {h.publishedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {publishing && (
        <PublishModal
          version={guide.version + 1}
          diff={diff}
          nameOf={(k) => catalog.templates.get(draft.find((s) => s.key === k)?.templateId ?? guide.steps.find((s) => s.key === k)?.templateId ?? '')?.name ?? k}
          onClose={() => setPublishing(false)}
          onPublish={(note) => {
            actions.publishGuide(guide.projectId, guide.visitPoint, draft, note, data.site.today);
            setPublishing(false);
          }}
        />
      )}
    </>
  );
}

function PublishModal({ version, diff, nameOf, onClose, onPublish }: {
  version: number; diff: ReturnType<typeof diffGuide>; nameOf(k: string): string; onClose(): void; onPublish(note: string): void;
}) {
  const [note, setNote] = useState('');
  const rows: [string, string[], string][] = [
    ['新增', diff.added, 'text-teal-700'],
    ['删除', diff.removed, 'text-rose-700'],
    ['调整顺序', diff.moved, 'text-amber-700'],
    ['调整时长', diff.retimed, 'text-sky-700'],
  ];
  return (
    <Modal
      open
      onClose={onClose}
      title={`发布导检 V${version}`}
      sub="发布后，新签到的受试者按新版本执行；已在场的人继续使用签到时锁定的版本。"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" disabled={!note.trim()} onClick={() => onPublish(note.trim())}>
            <Rocket className="size-4" />
            确认发布
          </Button>
        </>
      }
    >
      <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
        {rows
          .filter(([, list]) => list.length)
          .map(([label, list, cls]) => (
            <div key={label} className="flex gap-3 text-[13px]">
              <span className={cx('w-16 shrink-0 font-medium', cls)}>{label}</span>
              <span className="text-slate-700">{list.map(nameOf).join('、')}</span>
            </div>
          ))}
      </div>
      <div className="mt-4">
        <Field label="发布说明（必填，写清楚为什么改）">
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：方案修订 1.2，平衡时长调整" />
        </Field>
      </div>
    </Modal>
  );
}
