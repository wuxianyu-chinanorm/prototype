import { useState, type ReactNode } from 'react';
import { ArrowRight, Check, Clock, QrCode, ScanFace, Smartphone, Store, TriangleAlert } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import type { VisitContext } from '../../store/selectors';
import { hm, humanMinutes, md, toSec } from '../../domain/time';
import type { CheckinMethod } from '../../domain/types';
import { Avatar, Badge, Button, Segmented, cx } from '../../ui/kit';
import { Drawer } from '../../ui/overlay';
import { ProjectChip, WindowBadge } from '../../ui/visit';
import { StepIcon } from '../../ui/icons';

export function CheckinDrawer({ ctx, onClose }: { ctx: VisitContext; onClose(): void }) {
  const { now, actions } = useStore();
  const { subject, visit, project, steps } = ctx;
  const [method, setMethod] = useState<CheckinMethod>('app_qr');

  const identity = [
    { id: 'face', label: '人脸比对', detail: '相似度 98.6%（模拟）' },
    { id: 'id', label: '证件尾号一致', detail: `****${subject.idTail}` },
    { id: 'phone', label: '手机尾号一致', detail: `尾号 ${subject.phoneTail}` },
    { id: 'self', label: '本人到场', detail: '非代办、非代签' },
  ];
  const prep =
    visit.visitPoint === 'V1'
      ? [
          { id: 'nomakeup', label: '面部未化妆、今晨未用护肤品', detail: '影响测量与影像' },
          { id: 'nodrug', label: '近 24 小时未服抗过敏药', detail: '影响乳酸刺痛判断' },
          { id: 'time', label: '今天可停留约 2.5 小时', detail: '含 30 分钟平衡' },
        ]
      : [
          { id: 'product', label: '带回试用产品', detail: '用于回收称重' },
          { id: 'diary', label: '使用日记已同步', detail: 'App 打卡记录' },
          { id: 'nomakeup', label: '面部未化妆', detail: '影响测量与影像' },
        ];

  const [checked, setChecked] = useState<Record<string, boolean>>({ face: method === 'app_qr' });
  const all = [...identity, ...prep];
  const allOk = all.every((i) => checked[i.id]);
  const blocked = ctx.window.state === 'out' || ctx.window.state === 'early';
  const arriveDiff = Math.round((now - toSec(visit.slot.start)) / 60);
  const totalMin = steps.reduce((s, x) => s + x.minutes, 0);

  const submit = () => {
    actions.checkIn(visit.id, method);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      width={600}
      title="签到核验"
      sub="身份与访前确认全部通过后放行；签到成功后受试者手机会收到第一站"
      footer={
        <>
          <span className="text-xs text-slate-500">
            已核验 {all.filter((i) => checked[i.id]).length} / {all.length}
          </span>
          <div className="ml-auto flex gap-2">
            <Button onClick={onClose}>取消</Button>
            <Button variant="primary" disabled={!allOk || blocked} onClick={submit}>
              <Check className="size-4" />
              确认签到
            </Button>
          </div>
        </>
      }
    >
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-200/70">
        <Avatar name={subject.name} hue={subject.hue} size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold text-slate-900">
            {subject.name}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {subject.gender} · {subject.age} 岁 · {subject.skinType}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ProjectChip project={project} visitPoint={visit.visitPoint} />
            <span className="text-xs text-slate-500">{project.name}</span>
          </div>
        </div>
      </div>

      <Section title="三层时间">
        <div className="grid grid-cols-3 gap-2">
          <TimeCell n="①" label="访视窗" value={visit.window.start === visit.window.end ? md(visit.window.start) : `${md(visit.window.start)} – ${md(visit.window.end)}`} foot={<WindowBadge info={ctx.window} />} />
          <TimeCell n="②" label="预约时段" value={`${visit.slot.start} – ${visit.slot.end}`} foot={<span className="text-[11.5px] text-slate-500">今天</span>} />
          <TimeCell
            n="③"
            label="实际到达"
            value={hm(now)}
            highlight
            foot={
              <Badge intent={arriveDiff > 10 ? 'warn' : arriveDiff < -30 ? 'info' : 'ok'}>
                {arriveDiff > 10 ? `迟到 ${humanMinutes(arriveDiff)}` : arriveDiff < -30 ? `提前 ${humanMinutes(-arriveDiff)}` : '准时'}
              </Badge>
            }
          />
        </div>
        {blocked && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-[13px] text-rose-700 ring-1 ring-rose-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            不在访视窗内，不能签到。请改约到窗口内，或上报 PI 评估超窗偏离。
          </div>
        )}
        {ctx.window.state === 'edge' && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800 ring-1 ring-amber-200">
            <Clock className="mt-0.5 size-4 shrink-0" />
            今天是访视窗最后一天，若今日步骤未完成将无法在窗口内补做。
          </div>
        )}
      </Section>

      <Section title="签到方式">
        <Segmented<CheckinMethod>
          value={method}
          onChange={(m) => {
            setMethod(m);
            setChecked((c) => ({ ...c, face: m === 'app_qr' ? true : c.face }));
          }}
          options={[
            { value: 'app_qr', label: <><QrCode className="size-3.5" />受试者 App 扫码</> },
            { value: 'kiosk', label: <><Smartphone className="size-3.5" />自助机</> },
            { value: 'desk', label: <><Store className="size-3.5" />前台人工</> },
          ]}
        />
        {method === 'app_qr' && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-teal-50/70 p-3 text-[13px] text-teal-800 ring-1 ring-teal-200/70">
            <ScanFace className="size-5" />
            受试者出示 App 里的个人二维码（一人一码），系统自动匹配今天的预约。
          </div>
        )}
      </Section>

      <Section title="身份核验">
        <CheckList items={identity} checked={checked} onToggle={(id) => setChecked((c) => ({ ...c, [id]: !c[id] }))} />
      </Section>

      <Section title={visit.visitPoint === 'V1' ? '访前确认 · 首次筛选' : '访前确认 · 复访'}>
        <CheckList items={prep} checked={checked} onToggle={(id) => setChecked((c) => ({ ...c, [id]: !c[id] }))} />
      </Section>

      <Section title={`今日导检 · V${visit.guideVersion} · ${steps.length} 步 · 约 ${humanMinutes(totalMin)}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {steps.map((s, i) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className={cx('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1', i === 0 ? 'bg-teal-600 text-white ring-teal-600' : s.template.isGateAnchor ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-white text-slate-600 ring-slate-200')}>
                <StepIcon name={s.template.icon} className="size-3.5" />
                {s.template.short}
              </span>
              {i < steps.length - 1 && <ArrowRight className="size-3 text-slate-300" />}
            </span>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          签到后第一站：<b className="text-slate-800">{steps[0]?.template.name}</b> @ {steps[0]?.station.name}
        </div>
      </Section>
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      {children}
    </section>
  );
}

function TimeCell({ n, label, value, foot, highlight }: { n: string; label: string; value: string; foot: ReactNode; highlight?: boolean }) {
  return (
    <div className={cx('rounded-xl p-3 ring-1', highlight ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white ring-slate-200')}>
      <div className={cx('text-[11px] font-medium', highlight ? 'text-slate-400' : 'text-slate-400')}>
        {n} {label}
      </div>
      <div className="mt-1 font-mono text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="mt-1.5">{foot}</div>
    </div>
  );
}

function CheckList({ items, checked, onToggle }: { items: { id: string; label: string; detail: string }[]; checked: Record<string, boolean>; onToggle(id: string): void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onToggle(i.id)}
          className={cx('flex items-start gap-2.5 rounded-xl p-3 text-left ring-1 transition', checked[i.id] ? 'bg-emerald-50/70 ring-emerald-200' : 'bg-white ring-slate-200 hover:ring-slate-300')}
        >
          <span className={cx('mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-md transition', checked[i.id] ? 'bg-emerald-500 text-white' : 'ring-1 ring-slate-300')}>
            {checked[i.id] && <Check className="size-3" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-slate-800">{i.label}</span>
            <span className="block text-[11.5px] text-slate-500">{i.detail}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
