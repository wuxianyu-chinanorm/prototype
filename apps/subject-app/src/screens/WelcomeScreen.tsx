import { useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Btn, cx } from '../ui/kit';

export function WelcomeScreen() {
  const { content, actions } = useApp();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const { study } = content.profile;

  const login = () => {
    actions.login();
    nav('/home');
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      <div className="hero-mesh relative h-[400px] overflow-hidden px-7 pt-[92px] text-white">
        <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-white/20 text-[22px] font-bold backdrop-blur ring-1 ring-white/30">伙</div>
          <div className="mt-6 text-[32px] font-bold leading-[1.15] tracking-tight">
            试验伙伴
            <br />
            陪你走完每一次到访
          </div>
          <div className="mt-3 text-[14px] text-white/80">什么时候来、来了去哪、回家怎么用，都在这里。</div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] backdrop-blur ring-1 ring-white/25">
            <Sparkles size={13} />
            你已报名：{study.short}
          </div>
        </div>
      </div>

      <div className="-mt-8 flex-1 rounded-t-[32px] bg-white px-7 pt-8">
        <div className="text-[13px] font-medium text-slate-500">手机号</div>
        <div className="mt-1.5 flex h-[52px] items-center rounded-2xl bg-slate-100 px-4 text-[17px] font-medium tracking-wide text-slate-900">
          <span className="mr-3 text-slate-400">+86</span>
          {content.profile.subject.phone}
        </div>
        <div className="mt-4 flex items-center justify-between text-[13px] font-medium text-slate-500">
          验证码
          <button onClick={() => { setSent(true); setCode('482913'); }} className="font-semibold text-brand-600">
            {sent ? '已发送 · 59s' : '获取验证码'}
          </button>
        </div>
        <div className="mt-1.5 grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={cx('grid h-[52px] place-items-center rounded-2xl text-[22px] font-semibold', code[i] ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'bg-slate-100 text-slate-300')}>
              {code[i] ?? '·'}
            </div>
          ))}
        </div>
        <Btn className="mt-6 w-full" disabled={code.length < 6} onClick={login}>
          登录
        </Btn>
        <div className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-slate-400">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          登录即同意《隐私说明》。未登录时不展示任何研究信息；你的资料在研究中以编号代替姓名。
        </div>
      </div>
    </div>
  );
}
