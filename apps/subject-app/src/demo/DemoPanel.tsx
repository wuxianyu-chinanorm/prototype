import type { ReactNode } from 'react';
import { Pause, Play, RotateCcw, ScanLine, CheckCheck, PlayCircle, BadgeCheck, CircleSlash, LogOut, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '@vfp/guided-tour';
import { nowMode } from '../domain/journey';
import { cnDate, hm, weekday } from '../domain/time';
import { useApp } from '../store/AppStore';
import { cx } from '../ui/kit';

/** 演示控制台：切换剧情场景 + 代替「工作人员」推动现场状态。不属于 App 本身。 */
export function DemoPanel() {
  const { content, scenario, steps, now, running, actions, advance, toggleClock } = useApp();
  const nav = useNavigate();
  const tour = useTour();
  const mode = nowMode(scenario, steps, now);

  const groups = content.scenarios.reduce<Record<string, typeof content.scenarios>>((acc, s) => {
    (acc[s.group] ??= []).push(s);
    return acc;
  }, {});

  const pick = (id: string, route: string) => {
    actions.loadScenario(id);
    nav(route);
  };

  const current = 'step' in mode ? mode.step : undefined;
  const onsite = !!scenario.checkin && !scenario.checkedOut;

  return (
    <aside className="scroll-thin flex h-[calc(100%-40px)] w-[290px] shrink-0 flex-col gap-4 overflow-y-auto">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">Prototype · 受试者端</div>
        <div className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">试验伙伴 App</div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-slate-500">左侧切换剧情，右侧是每一屏的产品说明。手机里的浮层导览只在该屏第一次出现。</div>
      </div>

      <Panel title="剧情场景">
        <div className="space-y-3">
          {Object.entries(groups).map(([g, list]) => (
            <div key={g}>
              <div className="mb-1.5 text-[11px] font-semibold text-slate-400">{g}</div>
              <div className="space-y-1">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pick(s.id, s.route)}
                    className={cx(
                      'w-full rounded-xl px-3 py-2 text-left transition',
                      scenario.id === s.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'hover:bg-white/80',
                    )}
                  >
                    <div className="text-[13px] font-semibold">{s.label}</div>
                    <div className={cx('text-[11.5px]', scenario.id === s.id ? 'text-white/60' : 'text-slate-500')}>{s.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="演示时钟">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[26px] font-semibold tabular-nums text-slate-900">{hm(now)}</div>
            <div className="text-[11.5px] text-slate-500">
              {cnDate(scenario.today)} {weekday(scenario.today)} · {running ? '实时走动' : '已暂停'}
            </div>
          </div>
          <button onClick={toggleClock} className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[1, 5, 15].map((m) => (
            <button key={m} onClick={() => advance(m * 60)} className="flex items-center justify-center gap-1 rounded-lg bg-white py-1.5 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <Clock3 size={12} />+{m} 分
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="现场模拟（代替工作人员操作）">
        <div className="mb-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11.5px] text-slate-600">
          当前：{current ? <b className="text-slate-900">{current.name}</b> : mode.mode === 'finished' ? '今日项目已完成' : mode.mode === 'not_checked_in' ? '尚未签到' : '—'}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Sim icon={<ScanLine size={14} />} label="前台扫码签到" disabled={!!scenario.checkin} onClick={() => { actions.checkIn(); nav('/today'); }} />
          <Sim icon={<PlayCircle size={14} />} label="工位开始" disabled={!onsite || !current || !!scenario.active || current.kind === 'gate'} onClick={actions.stationStart} />
          <Sim icon={<CheckCheck size={14} />} label="工位完成" disabled={!onsite || !current || current.kind === 'gate'} onClick={actions.stationComplete} />
          <Sim icon={<LogOut size={14} />} label="前台签出" disabled={!onsite || scenario.enrollment === 'pending' && scenario.visitPoint === 'V1'} onClick={() => { actions.checkout(); nav('/checkout'); }} />
          <Sim icon={<BadgeCheck size={14} />} label="PI 判定入组" tone="ok" disabled={mode.mode !== 'gate'} onClick={() => { actions.decide('enrolled'); nav('/result'); }} />
          <Sim icon={<CircleSlash size={14} />} label="PI 判定筛败" tone="bad" disabled={mode.mode !== 'gate'} onClick={() => { actions.decide('failed'); nav('/result'); }} />
        </div>
      </Panel>

      <Panel title="新手导览">
        <div className="space-y-1">
          {tour.tours.map((t) => (
            <button key={t.id} onClick={() => tour.start(t.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-white">
              <span className="font-medium text-slate-800">{t.title}</span>
              <span className={cx('text-[11px]', tour.isSeen(t.id) ? 'text-slate-400' : 'text-brand-600')}>{tour.isSeen(t.id) ? '已看过' : '未看'}</span>
            </button>
          ))}
        </div>
        <button onClick={tour.reset} className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-slate-900">
          <RotateCcw size={12} />
          重置，让导览重新自动出现
        </button>
      </Panel>
    </aside>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3.5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <div className="mb-2.5 text-[12px] font-semibold text-slate-900">{title}</div>
      {children}
    </div>
  );
}

function Sim({ icon, label, onClick, disabled, tone }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean; tone?: 'ok' | 'bad' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : tone === 'bad' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
