import { CheckCircle2, ChevronRight, Info, ScanLine, SunMedium } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nextVisit } from '../domain/schedule';
import { cnDate } from '../domain/time';
import { useApp } from '../store/AppStore';
import { Btn, Page } from '../ui/kit';
import { QrCode } from '../ui/QrCode';

export function PassScreen() {
  const { content, scenario, actions } = useApp();
  const nav = useNavigate();
  const { subject } = content.profile;
  const next = nextVisit(content.schedule, scenario);
  const todayVisit = next?.appointment?.date === scenario.today ? next : undefined;
  const checked = !!scenario.checkin && !scenario.checkedOut;

  return (
    <Page tabbed className="!bg-[#0b1220]">
      <div className="px-5 pt-4 text-white">
        <div className="text-[13px] text-white/50">到访签到</div>
        <div className="text-[28px] font-bold tracking-tight">我的个人码</div>
      </div>

      <div className="mx-5 mt-5 overflow-hidden rounded-[30px] bg-white">
        <div className="hero-mesh flex items-center gap-3 px-5 py-4 text-white">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-[17px] font-bold ring-1 ring-white/40">{subject.nickname.slice(-1)}</div>
          <div className="flex-1">
            <div className="text-[17px] font-semibold">{subject.name}</div>
            <div className="text-[12px] text-white/70">
              {subject.gender} · {subject.age} 岁 · {subject.phone}
            </div>
          </div>
          <div className="text-right text-[11px] text-white/70">
            受试者码
            <div className="font-mono text-[13px] font-semibold text-white">{subject.sc}</div>
          </div>
        </div>
        <div className="relative flex flex-col items-center px-5 pb-5 pt-6">
          <div className={checked ? 'opacity-20 blur-[2px] transition' : 'transition'}>
            <QrCode seed={subject.subjectNo} size={228} />
          </div>
          {checked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ animation: 'rise .35s ease both' }}>
              <CheckCircle2 size={56} className="text-brand-500" strokeWidth={1.8} />
              <div className="mt-2 text-[20px] font-bold text-slate-900">已签到 · {scenario.checkin?.no}</div>
              <div className="text-[13px] text-slate-500">{scenario.checkin?.at} 由前台完成</div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-[12px] text-slate-400">
            <SunMedium size={13} />
            出示时屏幕已自动调到最亮
          </div>
        </div>
        <div className="border-t border-dashed border-slate-200 px-5 py-4">
          {todayVisit ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-slate-400">今天的预约</div>
                <div className="text-[15px] font-semibold text-slate-900">
                  {todayVisit.code} {todayVisit.title}
                </div>
              </div>
              <div className="text-right font-mono text-[15px] font-semibold text-slate-900">
                {todayVisit.appointment?.start}
                <div className="text-[11px] font-normal text-slate-400">{todayVisit.durationText}</div>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-slate-500">
              今天没有预约。{next?.appointment ? `下次到访 ${cnDate(next.appointment.date)} ${next.appointment.start}` : ''}
            </div>
          )}
        </div>
      </div>

      <div className="mx-5 mt-4 flex items-start gap-2 rounded-2xl bg-white/5 px-4 py-3 text-[12.5px] leading-relaxed text-white/60">
        <Info size={15} className="mt-0.5 shrink-0" />
        一人一码，每次到访都用这个码。前台扫码后，工作人员还会核对你的身份证尾号。
      </div>

      <div className="mx-5 mt-4">
        {checked ? (
          <Btn className="w-full" onClick={() => nav('/today')}>
            打开今日动线
            <ChevronRight size={18} />
          </Btn>
        ) : (
          <Btn
            tone="white"
            className="w-full"
            disabled={!todayVisit}
            onClick={() => {
              actions.checkIn();
              nav('/today');
            }}
          >
            <ScanLine size={18} />
            模拟：前台扫码
          </Btn>
        )}
      </div>
    </Page>
  );
}
