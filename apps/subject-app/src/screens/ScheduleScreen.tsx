import { useState } from 'react';
import { CalendarClock, Check, Info } from 'lucide-react';
import { visitStatuses, type VisitStatus } from '../domain/schedule';
import { addDays, dayDiff, md, weekday } from '../domain/time';
import type { ScheduledVisit } from '../domain/types';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, LargeTitle, Page, Pill, Sheet } from '../ui/kit';

const STATUS: Record<VisitStatus, { label: string; cls: string }> = {
  done: { label: '已完成', cls: 'bg-emerald-50 text-emerald-600' },
  today: { label: '今天', cls: 'bg-slate-900 text-white' },
  next: { label: '下一次', cls: 'bg-brand-50 text-brand-700' },
  later: { label: '未开始', cls: 'bg-slate-100 text-slate-500' },
};

export function ScheduleScreen() {
  const { content, scenario, actions } = useApp();
  const statuses = visitStatuses(content.schedule, scenario);
  const [editing, setEditing] = useState<ScheduledVisit | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { date: string; start: string }>>({});

  return (
    <Page tabbed>
      <LargeTitle title="访视日程" sub={content.profile.study.title} />
      <div className="space-y-3 px-4">
        {content.schedule.map((v) => {
          const st = statuses[v.code] ?? 'later';
          const appt = overrides[v.code] ?? v.appointment;
          const span = dayDiff(v.window.start, v.window.end) + 1;
          const pos = appt ? dayDiff(v.window.start, appt.date) : -1;
          return (
            <Card key={v.code} className={cx('p-4', st === 'done' && 'opacity-70')}>
              <div className="flex items-start gap-3">
                <div className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[15px] font-bold', st === 'done' ? 'bg-emerald-500 text-white' : st === 'later' ? 'bg-slate-100 text-slate-500' : 'hero-mesh text-white')}>
                  {st === 'done' ? <Check size={20} strokeWidth={3} /> : v.code}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-slate-900">{v.title}</span>
                    <Pill className={STATUS[st].cls}>{STATUS[st].label}</Pill>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-slate-500">
                    第 {v.day} 天 · {v.durationText}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>可到访窗口</span>
                  <span>
                    {md(v.window.start)}
                    {span > 1 ? ` – ${md(v.window.end)}（${span} 天）` : '（当天）'}
                  </span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {Array.from({ length: span }, (_, i) => {
                    const d = addDays(v.window.start, i);
                    return (
                      <div key={d} className={cx('flex h-9 flex-1 flex-col items-center justify-center rounded-lg text-[10.5px]', i === pos ? 'bg-slate-900 font-bold text-white' : 'bg-slate-50 text-slate-500')}>
                        <span>{weekday(d).slice(1)}</span>
                        <span className="font-semibold">{md(d).split('/')[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-[13.5px] text-slate-700">
                  {appt ? (
                    <>
                      <CalendarClock size={14} className="mr-1 inline text-brand-600" />
                      已约 {md(appt.date)} {weekday(appt.date)} {appt.start}
                    </>
                  ) : (
                    <span className="text-slate-400">还没预约</span>
                  )}
                </div>
                {st !== 'done' && st !== 'today' && span > 1 && (
                  <Btn tone="soft" size="sm" onClick={() => setEditing(v)}>
                    {appt ? '改期' : '预约'}
                  </Btn>
                )}
              </div>
            </Card>
          );
        })}
        <div className="flex items-start gap-2 px-1 pt-1 text-[12px] leading-relaxed text-slate-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          每次到访必须在窗口内完成，这是研究方案的要求。窗口内都约不上，请联系研究协调员。
        </div>
      </div>

      <RescheduleSheet
        visit={editing}
        slots={content.profile.site.slots}
        onClose={() => setEditing(null)}
        onConfirm={(date, start) => {
          if (!editing) return;
          setOverrides((o) => ({ ...o, [editing.code]: { date, start } }));
          actions.notify(`${editing.code} 改期已提交`, `${md(date)} ${start} · 研究协调员确认后会通知你`);
          setEditing(null);
        }}
      />
    </Page>
  );
}

function RescheduleSheet({ visit, slots, onClose, onConfirm }: { visit: ScheduledVisit | null; slots: { start: string; left: number }[]; onClose: () => void; onConfirm: (date: string, start: string) => void }) {
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  if (!visit) return null;
  const span = dayDiff(visit.window.start, visit.window.end) + 1;
  const days = Array.from({ length: span }, (_, i) => addDays(visit.window.start, i));
  return (
    <Sheet open onClose={onClose} title={`${visit.code} 选择到访时间`}>
      <div className="text-[12.5px] text-slate-500">只能在访视窗 {md(visit.window.start)}–{md(visit.window.end)} 内选择</div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {days.map((d) => (
          <button key={d} onClick={() => setDate(d)} className={cx('flex flex-col items-center rounded-2xl py-2.5', date === d ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700')}>
            <span className="text-[11px] opacity-70">{weekday(d)}</span>
            <span className="text-[17px] font-bold">{md(d).split('/')[1]}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-[13px] font-semibold text-slate-900">时段</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {slots.map((s) => (
          <button
            key={s.start}
            disabled={s.left === 0}
            onClick={() => setSlot(s.start)}
            className={cx('rounded-xl py-2.5 text-[14px] font-semibold disabled:opacity-35', slot === s.start ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-700')}
          >
            {s.start}
            <span className="block text-[10.5px] font-normal opacity-70">{s.left === 0 ? '已约满' : `剩 ${s.left} 位`}</span>
          </button>
        ))}
      </div>
      <Btn className="mt-5 w-full" disabled={!date || !slot} onClick={() => date && slot && onConfirm(date, slot)}>
        提交改期
      </Btn>
      <div className="mt-2 text-center text-[11.5px] text-slate-400">提交后研究协调员确认，确认结果会推送给你</div>
    </Sheet>
  );
}
