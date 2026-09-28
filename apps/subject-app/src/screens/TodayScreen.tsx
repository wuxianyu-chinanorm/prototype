import { useState, type ReactNode } from 'react';
import {
  ArrowRight, Check, Clock, DoorOpen, Footprints, HandHelping, HeartPulse, Lock, LogOut, MapPinned, QrCode, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tourAnchor } from '@vfp/guided-tour';
import { nowMode, viewJourney, type JourneyView, type NowMode } from '../domain/journey';
import { mmss } from '../domain/time';
import type { JourneyStep, Scenario } from '../domain/types';
import { useApp } from '../store/AppStore';
import { StepIcon } from '../ui/icons';
import { Btn, Card, cx, LargeTitle, Page, Ring, Section, Sheet } from '../ui/kit';

export function TodayScreen() {
  const { content, scenario, steps, now } = useApp();
  const nav = useNavigate();
  const visit = content.schedule.find((v) => v.code === scenario.visitPoint);
  const views = viewJourney(scenario, steps, now);
  const mode = nowMode(scenario, steps, now);
  const doneCount = views.filter((v) => v.state === 'done').length;
  const total = views.filter((v) => v.state !== 'skipped').length;
  const [help, setHelp] = useState(false);

  if (!scenario.checkin) {
    return (
      <Page tabbed>
        <LargeTitle title="今日" sub={visit ? `${visit.code} · ${visit.title}` : undefined} />
        <div className="px-4">
          <Card className="flex flex-col items-center px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
              <QrCode size={30} />
            </div>
            <div className="mt-4 text-[18px] font-bold text-slate-900">到了中心先签到</div>
            <div className="mt-1.5 text-[14px] leading-relaxed text-slate-500">在前台出示个人码，签到后这里会一步步告诉你去哪个房间、做什么。</div>
            <Btn className="mt-6 w-full" onClick={() => nav('/pass')}>
              出示个人码
            </Btn>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page tabbed>
      <LargeTitle
        title="今日动线"
        sub={visit ? `${visit.code} · ${visit.title}` : undefined}
        right={
          <div className="mb-1 rounded-2xl bg-white px-3 py-1.5 text-right shadow-sm">
            <div className="text-[10.5px] text-slate-400">签到号</div>
            <div className="font-mono text-[17px] font-bold leading-tight text-slate-900">{scenario.checkin.no}</div>
          </div>
        }
      />

      <div className="px-4">
        <NowCard mode={mode} steps={steps} scenario={scenario} />
      </div>

      <div className="mt-4 flex items-center gap-3 px-5">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700" style={{ width: `${(doneCount / Math.max(1, total)) * 100}%` }} />
        </div>
        <div className="text-[12.5px] font-semibold tabular-nums text-slate-500">
          {doneCount}/{total} 项
        </div>
      </div>

      <Section title="今天的全部安排" action={<span className="text-[12px] text-slate-400">顺序由研究方案固定</span>}>
        <Card anchor="journey-list" className="px-2 py-2">
          {views.map((v, i) => (
            <JourneyRow key={v.step.key} view={v} last={i === views.length - 1} gateLine={v.step.kind === 'gate'} />
          ))}
        </Card>
      </Section>

      <div className="px-4 pt-4">
        <div {...tourAnchor('help-bar')} className="grid grid-cols-3 gap-2">
          <HelpBtn icon={<MapPinned size={18} />} label="找不到房间" onClick={() => setHelp(true)} />
          <HelpBtn icon={<HeartPulse size={18} />} label="身体不舒服" tone="rose" onClick={() => setHelp(true)} />
          <HelpBtn icon={<DoorOpen size={18} />} label="临时离开" onClick={() => setHelp(true)} />
        </div>
      </div>

      <HelpSheet open={help} onClose={() => setHelp(false)} />
    </Page>
  );
}

function HelpBtn({ icon, label, onClick, tone }: { icon: ReactNode; label: string; onClick: () => void; tone?: 'rose' }) {
  return (
    <button onClick={onClick} className={cx('flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 text-[12.5px] font-medium shadow-sm active:scale-[0.98]', tone === 'rose' ? 'text-rose-600' : 'text-slate-700')}>
      {icon}
      {label}
    </button>
  );
}

function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions } = useApp();
  const opts: { icon: ReactNode; title: string; sub: string; tone: string }[] = [
    { icon: <MapPinned size={18} />, title: '找不到房间', sub: '工作人员会来接你', tone: 'bg-sky-50 text-sky-600' },
    { icon: <HeartPulse size={18} />, title: '身体不舒服', sub: '研究医生会马上评估', tone: 'bg-rose-50 text-rose-600' },
    { icon: <Footprints size={18} />, title: '去洗手间 / 临时离开', sub: '静坐中离开需要重新计时', tone: 'bg-amber-50 text-amber-600' },
    { icon: <LogOut size={18} />, title: '今天想提前结束', sub: '会有工作人员跟你确认后续安排', tone: 'bg-slate-100 text-slate-600' },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="需要什么帮助？">
      <div className="space-y-2">
        {opts.map((o) => (
          <button
            key={o.title}
            onClick={() => {
              actions.requestHelp(o.title);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 text-left active:bg-slate-100"
          >
            <span className={cx('grid h-10 w-10 place-items-center rounded-xl', o.tone)}>{o.icon}</span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold text-slate-900">{o.title}</span>
              <span className="block text-[12.5px] text-slate-500">{o.sub}</span>
            </span>
            <ArrowRight size={16} className="text-slate-300" />
          </button>
        ))}
      </div>
      <div className="mt-4 text-center text-[12px] text-slate-400">紧急情况请直接告诉身边任何一位工作人员</div>
    </Sheet>
  );
}

function JourneyRow({ view, last, gateLine }: { view: JourneyView; last: boolean; gateLine: boolean }) {
  const { step, state } = view;
  const dim = state === 'locked' || state === 'skipped';
  return (
    <>
      {gateLine && (
        <div className="my-1 flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-rose-300 to-rose-300" />
          <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
            <ShieldCheck size={11} />
            入组判定线
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-rose-300 to-rose-300" />
        </div>
      )}
      <div className={cx('relative flex items-center gap-3 rounded-2xl px-2 py-2.5', (state === 'now' || state === 'waiting') && 'bg-brand-50/70')}>
        {!last && <span className={cx('absolute left-[27px] top-[44px] h-[calc(100%-30px)] w-[2px]', state === 'done' ? 'bg-brand-200' : 'bg-slate-100')} />}
        <span
          className={cx(
            'relative grid h-9 w-9 shrink-0 place-items-center rounded-xl',
            state === 'done' && 'bg-brand-500 text-white',
            (state === 'now' || state === 'waiting') && 'bg-slate-900 text-white',
            state === 'upcoming' && 'bg-slate-100 text-slate-500',
            dim && 'bg-slate-50 text-slate-300',
          )}
        >
          {state === 'done' ? <Check size={17} strokeWidth={3} /> : state === 'locked' ? <Lock size={15} /> : <StepIcon name={step.icon} size={17} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className={cx('flex items-center gap-1.5 text-[14.5px] font-semibold', dim ? 'text-slate-300' : state === 'done' ? 'text-slate-400' : 'text-slate-900')}>
            {step.name}
            {step.kind === 'self' && state !== 'done' && !dim && <span className="rounded-md bg-indigo-50 px-1.5 text-[10.5px] font-semibold text-indigo-500">自助</span>}
          </div>
          <div className={cx('text-[12px]', dim ? 'text-slate-300' : 'text-slate-500')}>
            {state === 'skipped' ? '本次不需要' : state === 'locked' ? '入组后进行' : `${step.place} · ${step.room}`}
          </div>
        </div>
        <div className="text-right text-[12px] tabular-nums">
          {state === 'now' && view.remainSec !== undefined ? (
            <span className="font-mono font-semibold text-brand-600">{mmss(view.remainSec)}</span>
          ) : state === 'now' ? (
            <span className="font-semibold text-brand-600">进行中</span>
          ) : state === 'waiting' ? (
            <span className="font-semibold text-slate-900">下一站</span>
          ) : (
            !dim && state !== 'done' && <span className="text-slate-400">约 {step.minutes} 分</span>
          )}
        </div>
      </div>
    </>
  );
}

function NowCard({ mode, steps, scenario }: { mode: NowMode; steps: JourneyStep[]; scenario: Scenario }) {
  const nav = useNavigate();
  const { actions } = useApp();
  const shell = (children: ReactNode, dark = true) => (
    <div
      {...tourAnchor('now-card')}
      className={cx('relative overflow-hidden rounded-[28px] p-5', dark ? 'hero-mesh text-white shadow-[0_24px_48px_-20px_rgba(15,118,110,0.65)]' : 'bg-white shadow-sm')}
      style={{ animation: 'rise .35s ease both' }}
    >
      {dark && <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />}
      <div className="relative">{children}</div>
    </div>
  );
  const nextOf = (key: string) => actions.nextAfter(steps, key, scenario);

  switch (mode.mode) {
    case 'go':
      return shell(
        <>
          <Eyebrow>请前往</Eyebrow>
          <div className="mt-1 text-[30px] font-bold leading-tight tracking-tight">{mode.step.place}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-lg bg-white px-2 py-0.5 font-mono text-[16px] font-bold text-brand-700">{mode.step.room}</span>
            <span className="text-[14px] text-white/80">{mode.step.name}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric icon={<Users size={14} />} label="前面还有" value={mode.queueAhead === 0 ? '无需排队' : `${mode.queueAhead} 人`} />
            <Metric icon={<Clock size={14} />} label="大约需要" value={`${mode.step.minutes} 分钟`} />
          </div>
          <Tip>{mode.step.tip}</Tip>
        </>,
      );
    case 'self':
      return shell(
        <>
          <Eyebrow>轮到你自己完成</Eyebrow>
          <div className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{mode.step.name}</div>
          <div className="mt-1 text-[14px] text-white/80">
            就在 {mode.step.place} · {mode.step.room}，用手机完成即可
          </div>
          <Tip>{mode.step.tip}</Tip>
          <button onClick={() => mode.step.selfRoute && nav(mode.step.selfRoute)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15.5px] font-semibold text-brand-700 active:scale-[0.98]">
            现在开始
            <ArrowRight size={17} />
          </button>
        </>,
      );
    case 'in_progress':
      return shell(
        <>
          <Eyebrow>正在进行</Eyebrow>
          <div className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{mode.step.name}</div>
          <div className="mt-1 text-[14px] text-white/80">
            {mode.step.place} · {mode.step.room} · 已进行 {Math.max(1, Math.floor(mode.elapsedSec / 60))} 分钟
          </div>
          <Tip>{mode.step.tip}</Tip>
        </>,
      );
    case 'balance': {
      const next = nextOf(mode.step.key);
      return shell(
        <div className="flex flex-col items-center text-center">
          <Eyebrow>{mode.step.place} · {mode.step.room}</Eyebrow>
          <div className="mt-3">
            <Ring value={1 - mode.remainSec / mode.totalSec} color="#ffffff">
              <div>
                <div className="font-mono text-[40px] font-bold leading-none tabular-nums">{mmss(mode.remainSec)}</div>
                <div className="mt-1 text-[12px] text-white/70">静坐剩余</div>
              </div>
            </Ring>
          </div>
          <div className="mt-3 text-[18px] font-bold">安静坐着就好</div>
          <div className="mt-1 max-w-[270px] text-[13px] leading-relaxed text-white/80">{mode.step.tip}</div>
          {next && (
            <div className="mt-4 flex w-full items-center gap-2 rounded-2xl bg-black/15 px-3 py-2.5 text-left text-[13px]">
              <span className="text-white/60">时间到后</span>
              <span className="font-semibold">{next.name}</span>
              <span className="ml-auto font-mono text-[12px] text-white/70">{next.room}</span>
            </div>
          )}
        </div>,
      );
    }
    case 'await_review':
      return shell(
        <>
          <Eyebrow>请在原地稍候</Eyebrow>
          <div className="mt-1 text-[26px] font-bold leading-tight tracking-tight">研究协调员正在核对你的签字</div>
          <div className="mt-1 text-[14px] text-white/80">
            {mode.step.place} · {mode.step.room} · 通常 5 分钟内
          </div>
          <Tip>核对完成后才开始正式检查。你可以随时再看一遍知情同意书。</Tip>
          <button onClick={() => nav('/consent')} className="mt-4 h-11 w-full rounded-2xl bg-white/15 text-[14px] font-semibold ring-1 ring-white/30">
            再看一遍知情同意书
          </button>
        </>,
      );
    case 'gate':
      return shell(
        <div className="flex flex-col items-center py-2 text-center">
          <div className="relative grid h-24 w-24 place-items-center">
            <span className="absolute inset-0 rounded-full bg-white/30" style={{ animation: 'breathe 2.4s ease-in-out infinite' }} />
            <span className="absolute inset-3 rounded-full bg-white/25" style={{ animation: 'breathe 2.4s .6s ease-in-out infinite' }} />
            <ShieldCheck size={38} className="relative" />
          </div>
          <div className="mt-3 text-[22px] font-bold">检查都做完啦</div>
          <div className="mt-1 max-w-[280px] text-[13.5px] leading-relaxed text-white/85">研究医生正在综合你的检查结果，判断是否适合参加。一般 5–15 分钟，结果会推送给你。</div>
          <div className="mt-4 rounded-full bg-black/15 px-3 py-1.5 text-[12.5px]">请在 {mode.step.place} 休息</div>
        </div>,
      );
    case 'finished':
      return shell(
        <>
          <Sparkles size={26} />
          <div className="mt-2 text-[26px] font-bold leading-tight tracking-tight">今天的项目都完成了</div>
          <div className="mt-1 text-[14px] text-white/80">请带好随身物品和领取的产品，到一楼前台签出。</div>
          <button onClick={() => nav('/checkout')} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[15.5px] font-semibold text-brand-700">
            查看今日小结
            <ArrowRight size={17} />
          </button>
        </>,
      );
    case 'screen_failed':
      return shell(
        <>
          <HandHelping size={26} className="text-slate-500" />
          <div className="mt-2 text-[22px] font-bold text-slate-900">今天的筛选到此结束</div>
          <div className="mt-1 text-[14px] text-slate-500">感谢你的时间，请查看说明并到前台签出。</div>
          <Btn className="mt-4 w-full" onClick={() => nav('/result')}>
            查看说明
          </Btn>
        </>,
        false,
      );
    case 'not_checked_in':
      return null;
  }
}

const Eyebrow = ({ children }: { children: ReactNode }) => <div className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white/70">{children}</div>;

const Metric = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl bg-black/15 px-3 py-2.5">
    <div className="flex items-center gap-1 text-[11.5px] text-white/60">
      {icon}
      {label}
    </div>
    <div className="mt-0.5 text-[16px] font-semibold">{value}</div>
  </div>
);

const Tip = ({ children }: { children: ReactNode }) => <div className="mt-4 rounded-2xl bg-white/12 px-3.5 py-3 text-[13px] leading-relaxed text-white/90 ring-1 ring-white/15">{children}</div>;
