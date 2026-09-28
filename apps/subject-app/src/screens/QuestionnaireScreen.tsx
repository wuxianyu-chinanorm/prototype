import { useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Btn, cx, NavBar, Page } from '../ui/kit';

type Answer = number | number[];

export function QuestionnaireScreen() {
  const { content, steps, actions } = useApp();
  const nav = useNavigate();
  const qn = content.questionnaire;
  const [i, setI] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const selfStep = steps.find((s) => s.kind === 'self' && s.selfRoute === '/questionnaire');
  const q = qn.questions[i];
  const a = q ? answers[q.id] : undefined;
  const answered = a !== undefined && (!Array.isArray(a) || a.length > 0);
  const last = i === qn.questions.length - 1;

  const set = (v: Answer) => q && setAnswers((s) => ({ ...s, [q.id]: v }));

  return (
    <Page>
      <NavBar title={qn.title} />
      {i < 0 ? (
        <div className="px-6 pt-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-indigo-400 to-sky-400 text-[30px] font-bold text-white shadow-lg shadow-indigo-500/30">{qn.questions.length}</div>
          <div className="mt-5 text-[24px] font-bold tracking-tight text-slate-900">{qn.title}</div>
          <div className="mt-2 text-[14.5px] leading-relaxed text-slate-500">{qn.intro}</div>
          <div className="mt-2 text-[13px] text-slate-400">共 {qn.questions.length} 题 · 约 2 分钟 · 提交即完成，无需等待工作人员</div>
          <Btn className="mt-8 w-full" onClick={() => setI(0)}>
            开始作答
          </Btn>
        </div>
      ) : q ? (
        <div className="px-5 pt-5" key={q.id} style={{ animation: 'rise .25s ease both' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setI(i - 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${((i + 1) / qn.questions.length) * 100}%` }} />
            </div>
            <span className="text-[12.5px] font-semibold tabular-nums text-slate-500">
              {i + 1}/{qn.questions.length}
            </span>
          </div>
          <div className="mt-6 text-[22px] font-bold leading-snug tracking-tight text-slate-900">{q.q}</div>
          <div className="mt-5">
            {q.type === 'scale' ? (
              <div>
                <div className="grid grid-cols-11 gap-1">
                  {Array.from({ length: q.max - q.min + 1 }, (_, k) => q.min + k).map((v) => (
                    <button key={v} onClick={() => set(v)} className={cx('aspect-square rounded-xl text-[14px] font-semibold transition', a === v ? 'scale-110 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-600 shadow-sm')}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[12px] text-slate-400">
                  <span>{q.minLabel}</span>
                  <span>{q.maxLabel}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {q.options.map((o, oi) => {
                  const on = Array.isArray(a) ? a.includes(oi) : a === oi;
                  return (
                    <button
                      key={o}
                      onClick={() => {
                        if (q.type === 'single') return set(oi);
                        const cur = Array.isArray(a) ? a : [];
                        set(on ? cur.filter((x) => x !== oi) : [...cur, oi]);
                      }}
                      className={cx('flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15.5px] font-medium transition', on ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-800 shadow-sm')}
                    >
                      <span className={cx('grid h-5 w-5 place-items-center border-2', q.type === 'multi' ? 'rounded-md' : 'rounded-full', on ? 'border-white bg-white text-indigo-500' : 'border-slate-300')}>
                        {on && <Check size={12} strokeWidth={3.5} />}
                      </span>
                      {o}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Btn
            className="mt-8 w-full !from-indigo-500 !to-indigo-600 !shadow-indigo-500/30"
            disabled={!answered}
            onClick={() => {
              if (!last) return setI(i + 1);
              if (selfStep) actions.submitQuestionnaire(selfStep.key);
              nav('/today');
            }}
          >
            {last ? '提交问卷' : '下一题'}
          </Btn>
        </div>
      ) : null}
    </Page>
  );
}
