import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock4, DoorClosed, FlaskConical, Footprints, RefreshCcw, ShieldCheck, TimerReset, TriangleAlert, UserRoundX, XCircle, CalendarX2, type LucideIcon,
} from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { toSec } from '../../domain/time';
import type { ExceptionItem, ExceptionType } from '../../domain/types';
import { Avatar, Badge, Button, Card, Empty, Field, PageHeader, Segmented, inputCls, cx } from '../../ui/kit';
import { Drawer } from '../../ui/overlay';

const TYPE: Record<ExceptionType, { label: string; icon: LucideIcon }> = {
  late: { label: '迟到', icon: Clock4 },
  no_show: { label: '缺席', icon: UserRoundX },
  icf_refused: { label: '知情拒绝', icon: XCircle },
  step_failed: { label: '步骤未通过', icon: TriangleAlert },
  lactate_abnormal: { label: '乳酸异常', icon: FlaskConical },
  mid_exit: { label: '中途离开', icon: Footprints },
  window_edge: { label: '窗口末日', icon: CalendarX2 },
  balance_override: { label: '提前 T0', icon: TimerReset },
  rescreen: { label: '再筛申请', icon: RefreshCcw },
  incomplete_checkout: { label: '未完成签出', icon: DoorClosed },
};

type StatusFilter = 'open' | 'resolved' | 'all';

export function ExceptionsPage() {
  const { data, now } = useStore();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [type, setType] = useState<ExceptionType | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = data.exceptions
    .filter((e) => (status === 'all' ? true : e.status === status))
    .filter((e) => (type === 'all' ? true : e.type === type))
    .sort((a, b) => ['high', 'medium', 'low'].indexOf(a.severity) - ['high', 'medium', 'low'].indexOf(b.severity));
  const types = [...new Set(data.exceptions.map((e) => e.type))];
  const current = data.exceptions.find((e) => e.id === openId);

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader title="异常中心" sub="所有偏离在这里闭环 · 每条必须选一个处置，处置会回写访视" />
      <div className="mb-4 flex flex-wrap items-center gap-3" {...tourAnchor('ex-filters')}>
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'open', label: '待处理', count: data.exceptions.filter((e) => e.status === 'open').length },
            { value: 'resolved', label: '已处置', count: data.exceptions.filter((e) => e.status === 'resolved').length },
            { value: 'all', label: '全部' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          <Chip on={type === 'all'} onClick={() => setType('all')}>
            全部类型
          </Chip>
          {types.map((t) => {
            const I = TYPE[t].icon;
            return (
              <Chip key={t} on={type === t} onClick={() => setType(t)}>
                <I className="size-3.5" />
                {TYPE[t].label}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 2xl:grid-cols-3" {...tourAnchor('ex-list')}>
        {list.length === 0 && (
          <Card className="col-span-full">
            <Empty icon={<ShieldCheck className="size-5" />} title="没有待处理的异常" sub="干得漂亮" />
          </Card>
        )}
        {list.map((e) => (
          <ExCard key={e.id} e={e} now={now} onOpen={() => setOpenId(e.id)} />
        ))}
      </div>

      {current && <ResolveDrawer e={current} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick(): void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium ring-1 transition', on ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300')}>
      {children}
    </button>
  );
}

function ExCard({ e, now, onOpen }: { e: ExceptionItem; now: number; onOpen(): void }) {
  const { data } = useStore();
  const subj = data.subjects.find((s) => s.id === e.subjectId);
  const T = TYPE[e.type];
  const left = Math.round((toSec(e.raisedAt) + e.slaMinutes * 60 - now) / 60);
  const pct = Math.max(0, Math.min(100, (1 - left / e.slaMinutes) * 100));
  return (
    <Card className={cx('flex flex-col p-5 transition hover:-translate-y-0.5', e.status === 'open' && e.severity === 'high' && 'ring-rose-200')}>
      <div className="flex items-center gap-2">
        <div className={cx('grid size-9 place-items-center rounded-xl', e.severity === 'high' ? 'bg-rose-50 text-rose-600' : e.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600')}>
          <T.icon className="size-[18px]" />
        </div>
        <div>
          <div className="text-[12px] font-medium text-slate-500">{T.label}</div>
          <div className="text-[11px] text-slate-400">
            {e.raisedAt} · {e.raisedBy}
          </div>
        </div>
        <div className="ml-auto">
          {e.status === 'resolved' ? <Badge intent="ok">已处置</Badge> : <Badge intent={left < 0 ? 'bad' : e.severity === 'high' ? 'bad' : 'warn'}>{left < 0 ? `超时 ${-left} 分` : left > 120 ? '今日内' : `剩 ${left} 分`}</Badge>}
        </div>
      </div>
      <div className="mt-3 text-[15px] font-semibold leading-snug text-slate-900">{e.title}</div>
      <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-slate-600">{e.detail}</p>
      {e.status === 'open' && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className={cx('h-full rounded-full', left < 0 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-teal-500')} style={{ width: `${pct}%` }} />
        </div>
      )}
      {e.resolution && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">✓ {e.resolution.choice} · {e.resolution.by} {e.resolution.at}</div>}
      <div className="mt-auto flex items-center gap-2 pt-4">
        {subj && <Avatar name={subj.name} hue={subj.hue} size={26} />}
        <span className="text-[13px] font-medium text-slate-700">{subj?.name}</span>
        {e.visitId && (
          <Link to={`/visits/${e.visitId}`} className="text-[12px] text-slate-400 hover:text-teal-700">
            查看访视
          </Link>
        )}
        {e.status === 'open' && (
          <Button size="sm" variant="dark" className="ml-auto" onClick={onOpen}>
            处置
          </Button>
        )}
      </div>
    </Card>
  );
}

function ResolveDrawer({ e, onClose }: { e: ExceptionItem; onClose(): void }) {
  const { data, actions } = useStore();
  const [choice, setChoice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actor, setActor] = useState(e.type === 'balance_override' ? '李昕' : e.type === 'lactate_abnormal' ? '陈思远' : data.site.operator.name);
  const subj = data.subjects.find((s) => s.id === e.subjectId);
  return (
    <Drawer
      open
      onClose={onClose}
      title={`处置 · ${TYPE[e.type].label}`}
      sub={`${subj?.name} · ${e.raisedAt} 由 ${e.raisedBy} 发起`}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            className="ml-auto"
            disabled={!choice}
            onClick={() => {
              actions.resolveException(e.id, choice!, note, actor);
              onClose();
            }}
          >
            确认处置
          </Button>
        </>
      }
    >
      <div className="text-[16px] font-semibold text-slate-900">{e.title}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{e.detail}</p>
      <div className="mt-6 mb-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">选择处置</div>
      <div className="space-y-2">
        {e.options.map((o) => (
          <button key={o} type="button" onClick={() => setChoice(o)} className={cx('flex w-full items-center gap-3 rounded-xl p-3.5 text-left ring-1 transition', choice === o ? 'bg-teal-50 ring-2 ring-teal-400' : 'bg-white ring-slate-200 hover:ring-slate-300')}>
            <span className={cx('grid size-4 place-items-center rounded-full ring-2', choice === o ? 'ring-teal-500' : 'ring-slate-300')}>{choice === o && <span className="size-2 rounded-full bg-teal-500" />}</span>
            <span className="text-[13.5px] text-slate-800">{o}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="处置人">
          <select className={inputCls} value={actor} onChange={(ev) => setActor(ev.target.value)}>
            {data.site.people.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} · {p.role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="备注">
          <input className={inputCls} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="可选" />
        </Field>
      </div>
    </Drawer>
  );
}
