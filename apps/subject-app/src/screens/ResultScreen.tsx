import { useState } from 'react';
import { ArrowRight, Camera, Heart, NotebookPen, Package, PartyPopper, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, Page } from '../ui/kit';

const CONFETTI = ['#14a896', '#6366f1', '#f59e0b', '#f472b6', '#0ea5e9'];

export function ResultScreen() {
  const { content, scenario } = useApp();
  const nav = useNavigate();
  const [invite, setInvite] = useState(true);

  if (scenario.enrollment === 'pending') {
    return (
      <Page>
        <div className="px-6 pt-24 text-center">
          <div className="text-[22px] font-bold text-slate-900">结果还在路上</div>
          <div className="mt-2 text-[14px] text-slate-500">研究医生判断后会第一时间推送给你。</div>
          <Btn className="mt-8 w-full" onClick={() => nav('/today')}>
            回到今日动线
          </Btn>
        </div>
      </Page>
    );
  }

  if (scenario.enrollment === 'enrolled') {
    const after = content.journeys[scenario.visitPoint]?.filter((s) => s.afterEnroll) ?? [];
    const icons = [<Camera key="c" size={18} />, <Package key="p" size={18} />, <NotebookPen key="n" size={18} />];
    return (
      <Page className="!bg-white">
        <div className="relative overflow-hidden">
          <div className="hero-mesh absolute inset-x-0 top-0 h-[360px]" />
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 h-2.5 w-1.5 rounded-sm"
              style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animation: `confetti ${2.4 + (i % 5) * 0.4}s ${(i % 7) * 0.25}s ease-in infinite` }}
            />
          ))}
          <div className="relative px-6 pt-10 text-center text-white">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-white/20 ring-1 ring-white/40 backdrop-blur">
              <PartyPopper size={36} />
            </div>
            <div className="mt-5 text-[30px] font-bold tracking-tight">欢迎加入研究！</div>
            <div className="mx-auto mt-2 max-w-[290px] text-[14px] leading-relaxed text-white/85">你已正式成为「{content.profile.study.short}」的一员。接下来 28 天，我们一起完成。</div>
          </div>
          <div className="relative mx-4 mt-8 rounded-[24px] bg-white p-4 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.35)]">
            <div className="text-[13px] font-semibold text-slate-500">今天还剩 {after.length} 项</div>
            <div className="mt-2 space-y-2">
              {after.map((s, i) => (
                <div key={s.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">{icons[i] ?? icons[0]}</span>
                  <span className="flex-1">
                    <span className="block text-[14.5px] font-semibold text-slate-900">{s.name}</span>
                    <span className="block text-[12px] text-slate-500">
                      {s.place} · {s.room}
                    </span>
                  </span>
                  <span className="text-[12px] text-slate-400">{s.minutes} 分</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 pt-4 text-center text-[12px] leading-relaxed text-slate-400">为保证结果客观，研究采用双盲设计：你和研究人员都不知道你用的是哪一种产品。</div>
        <div className="px-4 pt-5">
          <Btn className="w-full" onClick={() => nav('/today')}>
            继续今天的安排
            <ArrowRight size={18} />
          </Btn>
        </div>
      </Page>
    );
  }

  const comp = content.profile.study.compensation[0];
  return (
    <Page>
      <div className="px-6 pt-12 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-rose-50 text-rose-400">
          <Heart size={34} />
        </div>
        <div className="mt-5 text-[26px] font-bold tracking-tight text-slate-900">谢谢你今天的时间</div>
        <div className="mx-auto mt-2 max-w-[300px] text-[14.5px] leading-relaxed text-slate-500">根据今天的检查，你这次暂时不符合本研究的参加条件。这不代表你的皮肤有问题，只是和这项研究的要求不完全匹配。</div>
      </div>
      <div className="space-y-3 px-4 pt-6">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Wallet size={20} />
          </span>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-900">筛选补偿 ¥{comp?.amount ?? 100}</div>
            <div className="text-[12.5px] text-slate-500">签出后 3 个工作日内到账</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold text-slate-900">有合适的研究时通知我</div>
              <div className="text-[12.5px] text-slate-500">我们会优先邀请你参加其他项目</div>
            </div>
            <button onClick={() => setInvite(!invite)} className={cx('relative h-[31px] w-[51px] rounded-full transition', invite ? 'bg-brand-500' : 'bg-slate-200')}>
              <span className={cx('absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all', invite ? 'left-[22px]' : 'left-[2px]')} />
            </button>
          </div>
        </Card>
        <div className="px-1 text-[12.5px] leading-relaxed text-slate-400">如对结果有疑问，可以在前台请研究医生当面解释。今天的检查资料会按隐私说明保存。</div>
        <Btn className="w-full" onClick={() => nav('/checkout')}>
          去前台签出
        </Btn>
      </div>
    </Page>
  );
}
