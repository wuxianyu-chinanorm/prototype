import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, ChevronDown, CircleHelp, Clock, Eraser, FileCheck2, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tourAnchor } from '@vfp/guided-tour';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, NavBar, Page } from '../ui/kit';

type Phase = 'read' | 'quiz' | 'sign';

export function ConsentScreen() {
  const { content, scenario, actions } = useApp();
  const nav = useNavigate();
  const doc = content.consent;
  const [open, setOpen] = useState<string | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>('read');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [signed, setSigned] = useState(false);
  const [asked, setAsked] = useState(false);

  const allRead = read.size === doc.sections.length;
  const quizOk = doc.quiz.every((q) => answers[q.id] === q.answer);

  const toggle = (id: string) => {
    setOpen((o) => (o === id ? null : id));
    setRead((s) => new Set(s).add(id));
  };

  if (scenario.consent !== 'todo') {
    const reviewed = scenario.consent === 'reviewed';
    return (
      <Page>
        <NavBar title="知情同意书" />
        <div className="px-4 pt-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className={cx('grid h-12 w-12 place-items-center rounded-2xl', reviewed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                {reviewed ? <BadgeCheck size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <div className="text-[17px] font-bold text-slate-900">{reviewed ? '已签署并完成核对' : '已签署 · 等待研究协调员核对'}</div>
                <div className="text-[12.5px] text-slate-500">
                  {doc.version} · {reviewed ? '研究协调员已当面核对' : '核对完成后才开始检查'}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-[12.5px] leading-relaxed text-slate-500">这是你的副本，研究期间随时可看。你可以在任何时候退出研究，已发放的补偿不会收回。</div>
          </Card>
        </div>
        <div className="space-y-2 px-4 pt-3">
          {doc.sections.map((s) => (
            <SectionItem key={s.id} s={s} open={open === s.id} read onToggle={() => setOpen((o) => (o === s.id ? null : s.id))} />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <NavBar title="电子知情同意" />
      <div className="px-4 pt-4">
        <div className="rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-500 p-5 text-white shadow-[0_20px_40px_-20px_rgba(99,102,241,0.8)]">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white/75">
            <FileCheck2 size={14} />
            {doc.version} · 伦理批准 {doc.approvedAt}
          </div>
          <div className="mt-2 text-[21px] font-bold leading-snug">{content.profile.study.title}</div>
          <div className="mt-1 text-[12.5px] text-white/75">{doc.ethics}</div>
          <div className="mt-4 flex gap-1.5">
            {(['read', 'quiz', 'sign'] as Phase[]).map((p, i) => {
              const idx = ['read', 'quiz', 'sign'].indexOf(phase);
              return (
                <div key={p} className="flex-1">
                  <div className={cx('h-1.5 rounded-full', i <= idx ? 'bg-white' : 'bg-white/25')} />
                  <div className={cx('mt-1.5 text-[11.5px] font-semibold', i <= idx ? 'text-white' : 'text-white/50')}>{['① 逐节阅读', '② 小测验', '③ 签名'][i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {phase === 'read' && (
        <>
          <div className="flex items-center justify-between px-5 pb-2 pt-5">
            <div className="text-[15px] font-semibold text-slate-900">约 {doc.readMinutes} 分钟读完</div>
            <div className="text-[12.5px] font-semibold text-slate-500">
              已读 {read.size}/{doc.sections.length}
            </div>
          </div>
          <div {...tourAnchor('icf-sections')} className="space-y-2 px-4">
            {doc.sections.map((s) => (
              <SectionItem key={s.id} s={s} open={open === s.id} read={read.has(s.id)} onToggle={() => toggle(s.id)} />
            ))}
          </div>
          <div className="space-y-2 px-4 pt-5">
            <Btn className="w-full" disabled={!allRead} onClick={() => setPhase('quiz')}>
              {allRead ? '我都读完了，下一步' : `还有 ${doc.sections.length - read.size} 节没读`}
            </Btn>
            <AskButton asked={asked} onAsk={() => { setAsked(true); actions.requestHelp('知情同意有疑问'); }} />
          </div>
        </>
      )}

      {phase === 'quiz' && (
        <div className="space-y-3 px-4 pt-5">
          <div className="px-1 text-[13px] text-slate-500">答对全部 3 题才能签名。答错没关系，会告诉你正确答案。</div>
          {doc.quiz.map((q, qi) => {
            const a = answers[q.id];
            return (
              <Card key={q.id} className="p-4">
                <div className="text-[15px] font-semibold text-slate-900">
                  {qi + 1}. {q.q}
                </div>
                <div className="mt-3 space-y-1.5">
                  {q.options.map((o, oi) => {
                    const chosen = a === oi;
                    const right = oi === q.answer;
                    return (
                      <button
                        key={o}
                        onClick={() => setAnswers((s) => ({ ...s, [q.id]: oi }))}
                        className={cx(
                          'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] ring-1 transition',
                          chosen && right && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                          chosen && !right && 'bg-rose-50 text-rose-700 ring-rose-200',
                          !chosen && 'bg-slate-50 text-slate-700 ring-transparent',
                        )}
                      >
                        <span className="flex-1">{o}</span>
                        {chosen && (right ? <Check size={16} /> : <X size={16} />)}
                      </button>
                    );
                  })}
                </div>
                {a !== undefined && <div className={cx('mt-2 text-[12.5px] leading-relaxed', a === q.answer ? 'text-emerald-600' : 'text-rose-600')}>{q.explain}</div>}
              </Card>
            );
          })}
          <Btn className="w-full" disabled={!quizOk} onClick={() => setPhase('sign')}>
            去签名
          </Btn>
          <AskButton asked={asked} onAsk={() => { setAsked(true); actions.requestHelp('知情同意有疑问'); }} />
        </div>
      )}

      {phase === 'sign' && (
        <div className="px-4 pt-5">
          <Card className="p-4">
            <div className="text-[15px] font-semibold text-slate-900">我已阅读并理解以上内容，自愿参加本研究</div>
            <ul className="mt-2 space-y-1 text-[12.5px] text-slate-500">
              <li>· 我有足够时间考虑，问题已得到解答</li>
              <li>· 我知道可以随时退出，且不受影响</li>
              <li>· 我同意研究人员按隐私说明使用我的资料</li>
            </ul>
            <SignaturePad name={content.profile.subject.name} date={scenario.today} onChange={setSigned} />
          </Card>
          <div className="mt-3 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-slate-400">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            签名后，研究协调员会在知情室与你当面核对签字页，核对完成才会开始检查。
          </div>
          <Btn
            className="mt-4 w-full"
            disabled={!signed}
            onClick={() => {
              actions.signConsent();
              nav('/today');
            }}
          >
            确认签署
          </Btn>
          <Btn tone="ghost" className="mt-2 w-full" onClick={() => actions.requestHelp('决定不签署知情同意')}>
            我决定不参加
          </Btn>
        </div>
      )}
    </Page>
  );
}

function AskButton({ asked, onAsk }: { asked: boolean; onAsk: () => void }) {
  return (
    <button {...tourAnchor('icf-ask')} onClick={onAsk} className={cx('flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl text-[14.5px] font-semibold', asked ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-indigo-600 shadow-sm')}>
      <CircleHelp size={17} />
      {asked ? '已通知研究人员，马上来为你解答' : '我有疑问，想先问问'}
    </button>
  );
}

function SectionItem({ s, open, read, onToggle }: { s: { id: string; title: string; summary: string; body: string }; open: boolean; read: boolean; onToggle: () => void }) {
  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
        <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', read ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400')}>
          {read ? <Check size={14} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold text-slate-900">{s.title}</span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-500">{s.summary}</span>
        </span>
        <ChevronDown size={18} className={cx('mt-1 text-slate-300 transition', open && 'rotate-180')} />
      </button>
      {open && <div className="mx-4 mb-4 rounded-2xl bg-slate-50 p-3.5 text-[13.5px] leading-[1.75] text-slate-700" style={{ animation: 'rise .2s ease both' }}>{s.body}</div>}
    </Card>
  );
}

function SignaturePad({ name, date, onChange }: { name: string; date: string; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ratio = 2;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b1220';
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = e.currentTarget.offsetWidth / r.width;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sx };
  };

  const clear = () => {
    const c = ref.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setHas(false);
    onChange(false);
  };

  return (
    <div className="mt-4">
      <div className="relative h-[150px] overflow-hidden rounded-2xl bg-[repeating-linear-gradient(0deg,#f8fafc,#f8fafc_29px,#eef2f6_30px)] ring-1 ring-slate-200">
        <canvas
          ref={ref}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = e.currentTarget.getContext('2d');
            const p = pos(e);
            ctx?.beginPath();
            ctx?.moveTo(p.x, p.y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = e.currentTarget.getContext('2d');
            const p = pos(e);
            ctx?.lineTo(p.x, p.y);
            ctx?.stroke();
            if (!has) {
              setHas(true);
              onChange(true);
            }
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
        {!has && <div className="pointer-events-none absolute inset-0 grid place-items-center text-[14px] text-slate-300">在此处手写签名</div>}
        <button onClick={clear} className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11.5px] font-medium text-slate-500 shadow-sm">
          <Eraser size={12} />
          清除
        </button>
      </div>
      <div className="mt-2 flex justify-between text-[11.5px] text-slate-400">
        <span>签署人：{name}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
