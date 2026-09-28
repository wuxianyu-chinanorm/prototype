import { useState, type ReactNode } from 'react';
import { AlertTriangle, Check, Moon, Sun } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { addDays, dayDiff, md } from '../domain/time';
import type { DiaryEntry } from '../domain/types';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, LargeTitle, Page, Section, Sheet } from '../ui/kit';

const FEEL: Record<NonNullable<DiaryEntry['feeling']>, { label: string; cls: string }> = {
  mild: { label: '轻微', cls: 'bg-amber-50 text-amber-600 ring-amber-200' },
  moderate: { label: '明显', cls: 'bg-orange-50 text-orange-600 ring-orange-200' },
  severe: { label: '严重', cls: 'bg-rose-50 text-rose-600 ring-rose-200' },
};

export function DiaryScreen() {
  const { content, scenario, entries, actions } = useApp();
  const { diary, profile } = content;
  const [report, setReport] = useState(false);
  const enrolled = scenario.enrollment === 'enrolled' && (scenario.v1Done || scenario.checkedOut);

  if (!enrolled) {
    return (
      <Page tabbed>
        <LargeTitle title="使用日记" />
        <div className="px-4">
          <Card className="px-6 py-10 text-center">
            <div className="text-[17px] font-bold text-slate-900">入组并领取产品后开始</div>
            <div className="mt-1.5 text-[14px] text-slate-500">
              研究共 {diary.days} 天，每天早晚打卡一次。{profile.study.usage}。
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  const day = Math.min(diary.days, dayDiff(diary.startDate, scenario.today) + 1);
  const byDay = new Map(entries.map((e) => [e.day, e]));
  const today = byDay.get(day);
  const past = entries.filter((e) => e.day < day);
  const full = past.filter((e) => e.morning && e.evening).length;
  const rate = past.length ? Math.round((past.reduce((n, e) => n + Number(e.morning) + Number(e.evening), 0) / (past.length * 2)) * 100) : 100;
  const notes = entries.filter((e) => e.note || e.feeling).sort((a, b) => b.day - a.day);

  return (
    <Page tabbed>
      <LargeTitle title="使用日记" sub={`第 ${day} 天 · 共 ${diary.days} 天`} />

      <div className="px-4">
        <div {...tourAnchor('diary-today')} className="rounded-[26px] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-[15px] font-semibold text-slate-900">今天 {md(scenario.today)}</div>
            <div className="text-[12px] text-slate-400">{profile.study.usage}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <SlotBtn icon={<Sun size={22} />} label="早上" time={diary.reminders.morning} on={!!today?.morning} onClick={() => actions.toggleDiary(day, 'morning')} tone="from-amber-300 to-orange-400" />
            <SlotBtn icon={<Moon size={22} />} label="晚上" time={diary.reminders.evening} on={!!today?.evening} onClick={() => actions.toggleDiary(day, 'evening')} tone="from-indigo-400 to-violet-500" />
          </div>
        </div>
      </div>

      <Section title="28 天打卡" action={<span className="text-[12.5px] text-slate-500">完成率 <b className="text-slate-900">{rate}%</b> · 全勤 {full} 天</span>}>
        <Card anchor="diary-calendar" className="p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: diary.days }, (_, i) => {
              const d = i + 1;
              const e = byDay.get(d);
              const both = e?.morning && e?.evening;
              const half = e && (e.morning || e.evening) && !both;
              const isToday = d === day;
              const future = d > day;
              return (
                <div
                  key={d}
                  className={cx(
                    'relative grid aspect-square place-items-center rounded-xl text-[12.5px] font-semibold',
                    both && 'bg-brand-500 text-white',
                    half && 'bg-[linear-gradient(135deg,#14a896_50%,#d2f5ee_50%)] text-white',
                    !e && !future && !isToday && 'bg-rose-50 text-rose-400',
                    future && 'bg-slate-50 text-slate-300',
                    isToday && !both && !half && 'bg-white text-slate-900 ring-2 ring-slate-900',
                    isToday && (both || half) && 'ring-2 ring-slate-900 ring-offset-1',
                  )}
                >
                  {d}
                  {e?.feeling && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-white" />}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
            <Legend cls="bg-brand-500">早晚都打</Legend>
            <Legend cls="bg-[linear-gradient(135deg,#14a896_50%,#d2f5ee_50%)]">只打一次</Legend>
            <Legend cls="bg-amber-400 !h-1.5 !w-1.5 rounded-full">有记录不适</Legend>
          </div>
          <div className="mt-2 text-[11.5px] text-slate-400">
            {md(diary.startDate)} 开始 · {md(addDays(diary.startDate, diary.days - 1))} 结束 · 漏打可以补记，会标注「补记」
          </div>
        </Card>
      </Section>

      <div className="px-4 pt-4">
        <button {...tourAnchor('diary-report')} onClick={() => setReport(true)} className="flex w-full items-center gap-3 rounded-[22px] bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-4 text-left text-white shadow-[0_16px_30px_-14px_rgba(244,63,94,0.7)] active:scale-[0.99]">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
            <AlertTriangle size={22} />
          </span>
          <span className="flex-1">
            <span className="block text-[16px] font-semibold">感觉不舒服？马上告诉医生</span>
            <span className="block text-[12.5px] text-white/80">刺痒、发红、起疹子… 越早说越好</span>
          </span>
        </button>
      </div>

      {notes.length > 0 && (
        <Section title="我的记录">
          <Card className="divide-y divide-slate-100">
            {notes.map((e) => (
              <div key={e.day} className="flex items-start gap-3 px-4 py-3">
                <div className="w-12 shrink-0 text-[12.5px] font-semibold text-slate-400">第 {e.day} 天</div>
                <div className="flex-1 text-[13.5px] text-slate-700">{e.note}</div>
                {e.feeling && <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', FEEL[e.feeling].cls)}>{FEEL[e.feeling].label}</span>}
              </div>
            ))}
          </Card>
        </Section>
      )}

      <ReportSheet
        open={report}
        symptoms={diary.symptoms}
        onClose={() => setReport(false)}
        onSubmit={(text) => {
          const doctor = profile.contacts.find((c) => c.role.includes('医生'));
          actions.reportSymptom(text, doctor?.name.slice(0, 1) ?? '');
          setReport(false);
        }}
      />
    </Page>
  );
}

function SlotBtn({ icon, label, time, on, onClick, tone }: { icon: ReactNode; label: string; time: string; on: boolean; onClick: () => void; tone: string }) {
  return (
    <button onClick={onClick} className={cx('relative overflow-hidden rounded-[20px] p-3.5 text-left transition active:scale-[0.98]', on ? `bg-gradient-to-br ${tone} text-white shadow-lg` : 'bg-slate-50 text-slate-700')}>
      <div className="flex items-center justify-between">
        {icon}
        <span className={cx('grid h-7 w-7 place-items-center rounded-full', on ? 'bg-white/25' : 'border-2 border-dashed border-slate-300')}>{on && <Check size={15} strokeWidth={3} />}</span>
      </div>
      <div className="mt-4 text-[16px] font-bold">{label}</div>
      <div className={cx('text-[12px]', on ? 'text-white/80' : 'text-slate-400')}>{on ? '已打卡' : `提醒 ${time}`}</div>
    </button>
  );
}

const Legend = ({ cls, children }: { cls: string; children: ReactNode }) => (
  <span className="flex items-center gap-1.5">
    <span className={cx('h-3 w-3 rounded', cls)} />
    {children}
  </span>
);

function ReportSheet({ open, symptoms, onClose, onSubmit }: { open: boolean; symptoms: string[]; onClose: () => void; onSubmit: (text: string) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [level, setLevel] = useState<keyof typeof FEEL>('mild');
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <Sheet open={open} onClose={onClose} title="上报不适">
      <div className="text-[13px] font-semibold text-slate-900">哪里不舒服？</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {symptoms.map((s) => (
          <button key={s} onClick={() => toggle(s)} className={cx('rounded-full px-3.5 py-2 text-[14px] font-medium', picked.includes(s) ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-700')}>
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4 text-[13px] font-semibold text-slate-900">有多严重？</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(Object.keys(FEEL) as (keyof typeof FEEL)[]).map((k) => (
          <button key={k} onClick={() => setLevel(k)} className={cx('rounded-2xl py-3 text-[14px] font-semibold ring-1', level === k ? FEEL[k].cls : 'bg-white text-slate-500 ring-slate-200')}>
            {FEEL[k].label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-slate-500">严重不适（呼吸困难、大面积红肿）请立即停用，并拨打「我的」页面里的 24 小时电话。</div>
      <Btn tone="dark" className="mt-4 w-full" disabled={picked.length === 0} onClick={() => onSubmit(`${picked.join('、')}（${FEEL[level].label}）`)}>
        提交给研究医生
      </Btn>
    </Sheet>
  );
}
