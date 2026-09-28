import { useState, type ReactNode } from 'react';
import { Bell, CalendarClock, Check, ChevronRight, FileText, MapPin, Navigation, NotebookPen, Phone, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { countdownText, nextVisit, secondsUntil, visitStatuses } from '../domain/schedule';
import { cnDate, dayDiff, md, weekday } from '../domain/time';
import { useApp } from '../store/AppStore';
import { Card, cx, Page, Section } from '../ui/kit';

export function HomeScreen() {
  const { content, scenario, now, unread, entries } = useApp();
  const nav = useNavigate();
  const { profile, schedule, diary } = content;
  const next = nextVisit(schedule, scenario);
  const statuses = visitStatuses(schedule, scenario);
  const until = next ? secondsUntil(next, scenario.today, now) : undefined;
  const isToday = next?.appointment?.date === scenario.today;
  const onsite = !!scenario.checkin && !scenario.checkedOut;
  const inUse = scenario.enrollment === 'enrolled' && (scenario.v1Done || scenario.checkedOut);
  const diaryDay = dayDiff(diary.startDate, scenario.today) + 1;
  const todayEntry = entries.find((e) => e.day === diaryDay);
  const hour = Math.floor(now / 3600);
  const greet = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <Page tabbed>
      <div className="flex items-center justify-between px-5 pb-1 pt-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full text-[16px] font-bold text-white" style={{ background: `linear-gradient(135deg, hsl(${profile.subject.hue} 80% 65%), hsl(${profile.subject.hue + 40} 75% 55%))` }}>
            {profile.subject.nickname.slice(-1)}
          </div>
          <div>
            <div className="text-[13px] text-slate-500">{greet}</div>
            <div className="text-[19px] font-bold tracking-tight text-slate-900">{profile.subject.nickname}</div>
          </div>
        </div>
        <button onClick={() => nav('/messages')} className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm">
          <Bell size={20} className="text-slate-700" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10.5px] font-bold text-white ring-2 ring-white">{unread}</span>}
        </button>
      </div>

      {onsite && (
        <div className="px-4 pt-3">
          <button onClick={() => nav('/today')} className="flex w-full items-center gap-3 rounded-[20px] bg-slate-900 px-4 py-3.5 text-left text-white">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-brand-500">
              <span className="absolute inset-0 rounded-full bg-brand-400" style={{ animation: 'breathe 2s ease-in-out infinite' }} />
              <MapPin size={17} className="relative" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold">你正在中心 · 签到号 {scenario.checkin?.no}</span>
              <span className="block text-[12.5px] text-white/60">打开今日动线，看下一步去哪</span>
            </span>
            <ChevronRight size={18} className="text-white/50" />
          </button>
        </div>
      )}

      {next && (
        <div className="px-4 pt-3">
          <div data-tour="next-visit" className="hero-mesh relative overflow-hidden rounded-[28px] p-5 text-white shadow-[0_24px_48px_-20px_rgba(15,118,110,0.65)]">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold backdrop-blur">
                  {next.code} · {next.title}
                </span>
                <span className="text-[12px] text-white/75">{next.durationText}</span>
              </div>
              {next.appointment ? (
                <>
                  <div className="mt-4 text-[13px] text-white/75">{isToday ? '今天' : `${cnDate(next.appointment.date)} ${weekday(next.appointment.date)}`}</div>
                  <div className="text-[40px] font-bold leading-none tracking-tight tabular-nums">
                    {next.appointment.start}
                    <span className="ml-1 text-[18px] font-semibold text-white/70">– {next.appointment.end}</span>
                  </div>
                  {until !== undefined && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-2.5 py-1 text-[12.5px] font-medium">
                      <CalendarClock size={13} />
                      {until > 0 ? `还有 ${countdownText(until)}` : onsite ? '已签到，进行中' : '已到预约时间，请到前台签到'}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  <div className="text-[13px] text-white/75">待预约 · 访视窗</div>
                  <div className="text-[28px] font-bold">
                    {md(next.window.start)} – {md(next.window.end)}
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-start gap-2 text-[13px] text-white/85">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  {profile.site.name} · {profile.site.address}
                  <span className="block text-[12px] text-white/60">{profile.site.metro}</span>
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white text-[14px] font-semibold text-brand-700">
                  <Navigation size={15} />
                  导航到中心
                </button>
                <button onClick={() => nav('/schedule')} className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white/15 text-[14px] font-semibold ring-1 ring-white/30 backdrop-blur">
                  <CalendarClock size={15} />
                  {next.appointment ? '改期' : '去预约'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inUse && (
        <Section title="今天的使用打卡">
          <Card className="flex items-center gap-3 p-4" onClick={() => nav('/diary')}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <NotebookPen size={20} />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-slate-900">使用第 {diaryDay} 天 / 共 {diary.days} 天</div>
              <div className="mt-1 flex gap-2 text-[12.5px]">
                <Slot on={!!todayEntry?.morning} label="早" />
                <Slot on={!!todayEntry?.evening} label="晚" />
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Card>
        </Section>
      )}

      {next && <PrepList key={next.code} items={next.prep} code={next.code} />}

      <Section title="我的研究进度" action={<button onClick={() => nav('/schedule')} className="text-[13px] font-medium text-brand-600">全部日程</button>}>
        <Card className="p-4">
          <div className="text-[14px] font-semibold text-slate-900">{profile.study.title}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">
            共 {profile.study.visits} 次到访 · {profile.study.durationDays} 天居家使用
          </div>
          <div className="relative mt-5 flex justify-between">
            <div className="absolute left-5 right-5 top-[15px] h-[3px] rounded-full bg-slate-100" />
            {schedule.map((v) => {
              const st = statuses[v.code];
              return (
                <div key={v.code} className="relative flex w-20 flex-col items-center text-center">
                  <div
                    className={cx(
                      'grid h-[33px] w-[33px] place-items-center rounded-full text-[12px] font-bold ring-4 ring-white',
                      st === 'done' && 'bg-brand-500 text-white',
                      (st === 'today' || st === 'next') && 'bg-slate-900 text-white',
                      st === 'later' && 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {st === 'done' ? <Check size={16} strokeWidth={3} /> : v.code}
                  </div>
                  <div className="mt-1.5 text-[12px] font-semibold text-slate-800">第 {v.day} 天</div>
                  <div className="text-[11px] text-slate-400">
                    {v.window.start === v.window.end ? md(v.window.start) : `${md(v.window.start)}–${md(v.window.end)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Section>

      <Section title="常用">
        <div className="grid grid-cols-3 gap-2.5">
          <Quick icon={<FileText size={19} />} tone="bg-indigo-50 text-indigo-600" label="知情同意书" onClick={() => nav('/consent')} />
          <Quick icon={<Phone size={19} />} tone="bg-emerald-50 text-emerald-600" label="联系研究团队" onClick={() => nav('/me')} />
          <Quick icon={<Sparkles size={19} />} tone="bg-rose-50 text-rose-500" label="补偿明细" onClick={() => nav('/me')} />
        </div>
      </Section>
    </Page>
  );
}

function Slot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold', on ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
      {on && <Check size={12} strokeWidth={3} />}
      {label}
      {on ? '已打卡' : '未打卡'}
    </span>
  );
}

function Quick({ icon, label, tone, onClick }: { icon: ReactNode; label: string; tone: string; onClick: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-4" onClick={onClick}>
      <div className={cx('grid h-10 w-10 place-items-center rounded-2xl', tone)}>{icon}</div>
      <div className="text-[12.5px] font-medium text-slate-700">{label}</div>
    </Card>
  );
}

function PrepList({ items, code }: { items: { id: string; text: string; why: string }[]; code: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  return (
    <Section title={`${code} 到访前准备`} action={<span className="text-[12.5px] text-slate-400">{checked.size}/{items.length}</span>}>
      <Card anchor="prep-list" className="overflow-hidden">
        {items.map((p, i) => {
          const on = checked.has(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} className={cx('flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-slate-50', i > 0 && 'border-t border-slate-100')}>
              <span className={cx('mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition', on ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300')}>
                {on && <Check size={13} strokeWidth={3.2} />}
              </span>
              <span className="flex-1">
                <span className={cx('block text-[15px] font-medium', on ? 'text-slate-400 line-through' : 'text-slate-900')}>{p.text}</span>
                <span className="block text-[12.5px] text-slate-500">{p.why}</span>
              </span>
            </button>
          );
        })}
      </Card>
    </Section>
  );
}
