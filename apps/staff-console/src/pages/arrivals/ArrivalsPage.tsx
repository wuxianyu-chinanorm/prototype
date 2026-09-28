import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, DoorOpen, QrCode, Smartphone, Store, UserRoundX } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../../store/StoreProvider';
import { useVisitContexts, type VisitContext } from '../../store/selectors';
import { lateMinutes, type Phase } from '../../domain/visitEngine';
import { Avatar, Badge, Button, Card, Empty, PageHeader, Segmented, cx } from '../../ui/kit';
import { PhaseBadge, ProjectChip, WindowBadge, WindowText } from '../../ui/visit';
import { CheckinDrawer } from './CheckinDrawer';

type Tab = 'waiting' | 'onsite' | 'out' | 'missed';

const TAB_PHASES: Record<Tab, Phase[]> = {
  waiting: ['upcoming', 'late'],
  onsite: ['onsite', 'ready_checkout', 'paused'],
  out: ['checked_out'],
  missed: ['no_show', 'cancelled'],
};

const METHOD = { app_qr: { label: 'App 扫码', icon: QrCode }, desk: { label: '前台人工', icon: Store }, kiosk: { label: '自助机', icon: Smartphone } } as const;

export function ArrivalsPage() {
  const ctxs = useVisitContexts();
  const { now, actions } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('waiting');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = ctxs
    .filter((c) => TAB_PHASES[tab].includes(c.phase))
    .sort((a, b) => a.visit.slot.start.localeCompare(b.visit.slot.start));
  const count = (t: Tab) => ctxs.filter((c) => TAB_PHASES[t].includes(c.phase)).length;
  const open = ctxs.find((c) => c.visit.id === openId);

  return (
    <div className="animate-[rise_.35s_ease]">
      <PageHeader
        title="到访签到"
        sub="对上今天这次预约才签到 · 访视窗 / 预约 / 实际到达 三层时间分开看"
        right={
          <Button variant="primary" onClick={() => setOpenId(list.find((c) => !c.visit.checkin)?.visit.id ?? null)}>
            <QrCode className="size-4" />
            扫码签到
          </Button>
        }
      />

      <div className="mb-4" {...tourAnchor('arrivals-tabs')}>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'waiting', label: '待到 / 迟到', count: count('waiting') },
            { value: 'onsite', label: '在场', count: count('onsite') },
            { value: 'out', label: '已签出', count: count('out') },
            { value: 'missed', label: '缺席 / 取消', count: count('missed') },
          ]}
        />
      </div>

      <Card {...tourAnchor('arrivals-table')}>
        <div className="grid grid-cols-[minmax(200px,1.3fr)_minmax(150px,1fr)_minmax(330px,2fr)_110px_150px] items-center gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <div>受试者</div>
          <div>项目 / 访视点</div>
          <div className="grid grid-cols-3 gap-3" {...tourAnchor('time-layers')}>
            <span>① 访视窗</span>
            <span>② 预约时段</span>
            <span>③ 实际到达</span>
          </div>
          <div>状态</div>
          <div className="text-right">操作</div>
        </div>
        {list.length === 0 && <Empty icon={<DoorOpen className="size-5" />} title="这里暂时没有人" />}
        <div className="divide-y divide-slate-100">
          {list.map((c) => (
            <Row key={c.visit.id} c={c} now={now} onCheckin={() => setOpenId(c.visit.id)} onNoShow={() => actions.markNoShow(c.visit.id)} onOpen={() => navigate(`/visits/${c.visit.id}`)} />
          ))}
        </div>
      </Card>

      {open && <CheckinDrawer ctx={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Row({ c, now, onCheckin, onNoShow, onOpen }: { c: VisitContext; now: number; onCheckin(): void; onNoShow(): void; onOpen(): void }) {
  const late = c.phase === 'late' ? lateMinutes(c.visit, now) : 0;
  const m = c.visit.checkin ? METHOD[c.visit.checkin.method] : undefined;
  return (
    <div className={cx('grid grid-cols-[minmax(200px,1.3fr)_minmax(150px,1fr)_minmax(330px,2fr)_110px_150px] items-center gap-4 px-5 py-3.5', c.phase === 'late' && 'bg-amber-50/40')}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={c.subject.name} hue={c.subject.hue} size={36} />
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-slate-900">
            {c.subject.name}
            <span className="ml-1.5 text-xs font-normal text-slate-400">
              {c.subject.gender} · {c.subject.age}
            </span>
          </div>
          <div className="font-mono text-[11.5px] text-slate-400">
            尾号 {c.subject.phoneTail} · {c.subject.sc}
            {c.subject.rd ? ` · ${c.subject.rd}` : ''}
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <ProjectChip project={c.project} visitPoint={c.visit.visitPoint} />
        <div className="mt-1 truncate text-[11.5px] text-slate-500">{c.project.visitPlan.find((v) => v.code === c.visit.visitPoint)?.name}</div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-[13px]">
        <div>
          <div className="text-slate-700">
            <WindowText start={c.visit.window.start} end={c.visit.window.end} />
          </div>
          <div className="mt-0.5">
            <WindowBadge info={c.window} />
          </div>
        </div>
        <div>
          <div className="font-mono tabular-nums text-slate-700">
            {c.visit.slot.start}–{c.visit.slot.end}
          </div>
          <div className="mt-0.5 text-[11.5px] text-slate-400">今天</div>
        </div>
        <div>
          {c.visit.checkin ? (
            <>
              <div className="font-mono tabular-nums text-slate-900">{c.visit.checkin.at}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500">
                {m && <m.icon className="size-3" />}
                {m?.label} · <span className="font-mono">{c.visit.checkin.no}</span>
              </div>
            </>
          ) : c.phase === 'late' ? (
            <div className="text-[13px] font-medium text-amber-600">已超 {late} 分钟</div>
          ) : (
            <div className="text-slate-400">未到</div>
          )}
        </div>
      </div>
      <div>
        <PhaseBadge phase={c.phase} />
      </div>
      <div className="flex justify-end gap-1.5">
        {!c.visit.checkin && (c.phase === 'upcoming' || c.phase === 'late') ? (
          <>
            {c.phase === 'late' && (
              <Button size="sm" variant="ghost" onClick={onNoShow} title="标记缺席">
                <UserRoundX className="size-3.5" />
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={onCheckin}>
              签到
            </Button>
          </>
        ) : c.visit.checkin ? (
          <Button size="sm" variant="ghost" onClick={onOpen}>
            详情 <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Badge intent="neutral">待改约</Badge>
        )}
      </div>
    </div>
  );
}
