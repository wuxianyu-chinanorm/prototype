import { useState, type ReactNode } from 'react';
import { BellRing, CalendarCheck2, Check, Clock, Package, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { effectiveDone } from '../domain/journey';
import { nextVisit } from '../domain/schedule';
import { cnDate, hm, md, toSec, weekday } from '../domain/time';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, NavBar, Page, Section } from '../ui/kit';

export function CheckoutScreen() {
  const { content, scenario, steps, now, actions } = useApp();
  const nav = useNavigate();
  const [stars, setStars] = useState(0);
  const done = effectiveDone(scenario, steps, now);
  const doneSteps = steps.filter((s) => done.has(s.key));
  const enrolled = scenario.enrollment === 'enrolled';
  const minutes = scenario.checkin ? Math.max(0, Math.round((now - toSec(scenario.checkin.at)) / 60)) : 0;
  const visitIdx = content.schedule.findIndex((v) => v.code === scenario.visitPoint);
  const comp = content.profile.study.compensation[visitIdx];
  const next = enrolled ? nextVisit(content.schedule, { ...scenario, checkedOut: true }) : undefined;

  return (
    <Page>
      <NavBar title={scenario.checkedOut ? '已签出' : '今日小结'} back="/today" />

      <div className="px-4 pt-4">
        <div className={cx('relative overflow-hidden rounded-[28px] p-5 text-white', scenario.checkedOut ? 'hero-mesh' : 'bg-slate-900')}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white/60">{scenario.visitPoint} · {cnDate(scenario.today)}</div>
            <div className="mt-1 text-[26px] font-bold tracking-tight">{scenario.checkedOut ? '已签出，辛苦啦' : '今天的项目都完成了'}</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="完成项目" value={`${doneSteps.length}`} unit="项" />
              <Stat label="在中心" value={`${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`} unit="时长" />
              <Stat label="签到" value={scenario.checkin?.at ?? '—'} unit={scenario.checkin?.no ?? ''} />
            </div>
          </div>
        </div>
      </div>

      {!scenario.checkedOut && (
        <div className="px-4 pt-4">
          <Card className="p-4">
            <div className="text-[15px] font-semibold text-slate-900">离开前请到一楼前台签出</div>
            <ul className="mt-2 space-y-1.5 text-[13.5px] text-slate-600">
              <Li>核对今天领取的产品与使用说明</Li>
              <Li>确认下一次到访时间</Li>
              <Li>签出后补偿才会进入发放流程</Li>
            </ul>
            <Btn tone="dark" className="mt-4 w-full" onClick={actions.checkout}>
              模拟：前台完成签出
            </Btn>
          </Card>
        </div>
      )}

      {next && (
        <Section title="下一次到访">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-center text-brand-700">
                <div>
                  <div className="text-[11px] font-semibold">{next.appointment ? weekday(next.appointment.date) : '待约'}</div>
                  <div className="text-[18px] font-bold leading-none">{next.appointment ? md(next.appointment.date) : '—'}</div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-slate-900">
                  {next.code} {next.title}
                </div>
                <div className="text-[12.5px] text-slate-500">
                  {next.appointment ? `${next.appointment.start} – ${next.appointment.end}` : ''} · 访视窗 {md(next.window.start)}–{md(next.window.end)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Btn tone="soft" size="md" className="flex-1" onClick={() => nav('/schedule')}>
                <CalendarCheck2 size={15} />
                调整时间
              </Btn>
              <Btn tone="ghost" size="md" className="flex-1">
                <BellRing size={15} />
                前一天提醒
              </Btn>
            </div>
          </Card>
        </Section>
      )}

      <Section title="带回家">
        <Card className="overflow-hidden">
          {enrolled ? (
            <>
              {content.profile.study.takeHome.map((t) => (
                <HomeRow key={t.title} icon={<Package size={18} />} tone="bg-violet-50 text-violet-600" title={t.title} sub={t.sub} />
              ))}
              <HomeRow icon={<Clock size={18} />} tone="bg-amber-50 text-amber-600" title={`每天 ${content.diary.reminders.morning} / ${content.diary.reminders.evening} 提醒打卡`} sub="在「日记」里点一下就好" />
            </>
          ) : (
            <HomeRow icon={<Check size={18} />} tone="bg-slate-100 text-slate-500" title="本次无需带走产品" sub="如有不适请联系研究医生" />
          )}
          {comp && (
            <HomeRow icon={<Wallet size={18} />} tone="bg-emerald-50 text-emerald-600" title={`补偿 ¥${comp.amount}`} sub={`${comp.item} · 签出后 3 个工作日内到账`} last />
          )}
        </Card>
      </Section>

      {scenario.checkedOut && (
        <Section title="今天的体验怎么样？">
          <Card className="p-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)}>
                  <Star size={34} className={n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                </button>
              ))}
            </div>
            <div className="mt-2 text-center text-[12.5px] text-slate-400">{stars ? '谢谢反馈！我们会继续改进等候时间' : '匿名，仅用于改进服务'}</div>
          </Card>
          <Btn className="mt-4 w-full" onClick={() => nav('/home')}>
            回到首页
          </Btn>
        </Section>
      )}
      <div className="px-4 pt-3 text-center text-[11.5px] text-slate-400">当前时间 {hm(now)}</div>
    </Page>
  );
}

const Li = ({ children }: { children: ReactNode }) => (
  <li className="flex items-center gap-2">
    <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-50 text-brand-600">
      <Check size={10} strokeWidth={3} />
    </span>
    {children}
  </li>
);

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="rounded-2xl bg-white/10 px-3 py-2.5">
    <div className="text-[11px] text-white/60">{label}</div>
    <div className="font-mono text-[19px] font-bold tabular-nums">{value}</div>
    <div className="text-[10.5px] text-white/50">{unit}</div>
  </div>
);

function HomeRow({ icon, tone, title, sub, last }: { icon: ReactNode; tone: string; title: string; sub: string; last?: boolean }) {
  return (
    <div className={cx('flex items-center gap-3 px-4 py-3.5', !last && 'border-b border-slate-100')}>
      <span className={cx('grid h-10 w-10 place-items-center rounded-xl', tone)}>{icon}</span>
      <div className="flex-1">
        <div className="text-[14.5px] font-semibold text-slate-900">{title}</div>
        <div className="text-[12.5px] text-slate-500">{sub}</div>
      </div>
    </div>
  );
}
