import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, Check, CircleCheck, TriangleAlert } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import type { VisitContext } from '../../store/selectors';
import { addDays, dayDiff, md, weekday } from '../../domain/time';
import { checkoutReadiness, nextVisitWindow } from '../../domain/visitEngine';
import { Badge, Button, cx } from '../../ui/kit';
import { Drawer } from '../../ui/overlay';

const REASONS = ['受试者中途离开', '身体不适', '设备故障', '现场时间不足', '其他'];
const SLOTS = ['09:00', '10:00', '13:30', '15:00'];

export function CheckoutDrawer({ ctx, onClose }: { ctx: VisitContext; onClose(): void }) {
  const { data, actions } = useStore();
  const readiness = checkoutReadiness(ctx.visit, ctx.steps, data.exceptions);
  const terminated = ctx.subject.status === 'screen_failed' || ctx.steps.some((s) => s.template.category === 'consent' && s.view === 'failed');
  const incomplete = !terminated && readiness.pending.length > 0;
  const next = terminated ? null : nextVisitWindow(ctx.project, ctx.subject, ctx.visit.visitPoint, data.site.today);

  const dates = useMemo(() => {
    if (!next) return [];
    const n = dayDiff(next.start, next.end);
    return Array.from({ length: n + 1 }, (_, i) => addDays(next.start, i));
  }, [next]);

  const [reason, setReason] = useState<string | null>(ctx.phase === 'paused' ? '受试者中途离开' : null);
  const [date, setDate] = useState<string | null>(next?.target ?? null);
  const [slot, setSlot] = useState<string>('09:00');
  const [told, setTold] = useState(false);

  const needAppt = Boolean(next);
  const ok = (!incomplete || reason) && (!needAppt || date) && (terminated || told);

  const submit = () => {
    actions.checkout(ctx.visit.id, terminated ? 'terminated' : incomplete ? 'incomplete' : 'complete', incomplete ? reason ?? undefined : terminated ? '筛选失败' : undefined, needAppt && date ? `${date} ${slot}` : undefined);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={`签出 · ${ctx.subject.name}`}
      sub="出门前最后一道关：核对完成度、约好下一次、交代注意事项"
      width={560}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant={incomplete ? 'danger' : 'primary'} className="ml-auto" disabled={!ok} onClick={submit}>
            <Check className="size-4" />
            {terminated ? '终止签出' : incomplete ? '未完成签出（生成补做任务）' : '确认签出'}
          </Button>
        </>
      }
    >
      <Block title="完成度">
        <div className={cx('flex items-center gap-3 rounded-2xl p-4 ring-1', readiness.pending.length === 0 ? 'bg-emerald-50/70 ring-emerald-200' : terminated ? 'bg-slate-50 ring-slate-200' : 'bg-amber-50/70 ring-amber-200')}>
          {readiness.pending.length === 0 ? <CircleCheck className="size-6 text-emerald-500" /> : <TriangleAlert className="size-6 text-amber-500" />}
          <div>
            <div className="text-[15px] font-semibold text-slate-900">
              {ctx.done} / {ctx.total} 步已完成
            </div>
            <div className="text-[12.5px] text-slate-600">
              {terminated ? '筛选已终止，未执行步骤按免做处理' : readiness.pending.length === 0 ? '今日导检全部完成' : `还有 ${readiness.pending.length} 步未做：${readiness.pending.map((s) => s.template.short).join('、')}`}
            </div>
          </div>
        </div>
        {readiness.openExceptions.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {readiness.openExceptions.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg bg-rose-50/70 px-3 py-2 text-[12.5px] text-rose-700 ring-1 ring-rose-200">
                <TriangleAlert className="size-3.5" />
                {e.title}
              </div>
            ))}
          </div>
        )}
      </Block>

      {incomplete && (
        <Block title="未完成原因（必填）">
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={cx('rounded-lg px-3 py-1.5 text-[13px] ring-1', reason === r ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-200')}>
                {r}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[12px] text-slate-500">签出后将生成「补做任务」并记录偏离，已完成的数据保留。</div>
        </Block>
      )}

      {next && (
        <Block title={`预约下一次 · ${next.point.code} ${next.point.name}`}>
          <div className="mb-3 flex items-center gap-2 text-[13px] text-slate-600">
            <CalendarDays className="size-4 text-slate-400" />
            访视窗 D{next.point.day}{next.point.minus || next.point.plus ? ` ±${next.point.plus}` : ''}：
            <b className="font-mono text-slate-900">
              {md(next.start)} – {md(next.end)}
            </b>
            <Badge intent="brand">目标 {md(next.target)}</Badge>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {dates.map((d) => (
              <button key={d} type="button" onClick={() => setDate(d)} className={cx('rounded-xl py-2 text-center ring-1 transition', date === d ? 'bg-teal-600 text-white ring-teal-600' : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300', d === next.target && date !== d && 'ring-teal-300')}>
                <div className="text-[10.5px] opacity-70">{weekday(d)}</div>
                <div className="font-mono text-[13px] font-semibold">{md(d)}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {SLOTS.map((s) => (
              <button key={s} type="button" onClick={() => setSlot(s)} className={cx('rounded-lg px-3 py-1.5 font-mono text-[12.5px] ring-1', slot === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200')}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[12px] text-slate-500">只能约在访视窗内；约好后受试者 App 会同步日程和提醒。</div>
        </Block>
      )}

      {!terminated && (
        <Block title="离场交代">
          <button type="button" onClick={() => setTold((t) => !t)} className={cx('flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1', told ? 'bg-emerald-50/70 ring-emerald-200' : 'bg-white ring-slate-200')}>
            <span className={cx('mt-0.5 grid size-[18px] place-items-center rounded-md', told ? 'bg-emerald-500 text-white' : 'ring-1 ring-slate-300')}>{told && <Check className="size-3" strokeWidth={3} />}</span>
            <span className="text-[13px] text-slate-700">
              已交代：产品用法用量、每日早晚在 App 打卡、出现不适立即通过 App 上报；下次到访前一晚不使用其他护肤品。
            </span>
          </button>
        </Block>
      )}
    </Drawer>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      {children}
    </section>
  );
}
