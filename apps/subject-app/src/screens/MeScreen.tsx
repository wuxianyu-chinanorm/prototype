import { useState } from 'react';
import { Bell, Building2, ChevronRight, FileText, LogOut, Phone, ShieldCheck, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Btn, Card, cx, IconTile, LargeTitle, Page, Row, Section, Sheet } from '../ui/kit';

export function MeScreen() {
  const { content, actions } = useApp();
  const nav = useNavigate();
  const { subject, study, site, contacts } = content.profile;
  const [withdraw, setWithdraw] = useState(false);
  const total = study.compensation.reduce((n, c) => n + c.amount, 0);

  return (
    <Page tabbed>
      <LargeTitle title="我的" />
      <div className="px-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="grid h-16 w-16 place-items-center rounded-full text-[24px] font-bold text-white" style={{ background: `linear-gradient(135deg, hsl(${subject.hue} 80% 65%), hsl(${subject.hue + 40} 75% 55%))` }}>
            {subject.nickname.slice(-1)}
          </div>
          <div className="flex-1">
            <div className="text-[19px] font-bold text-slate-900">{subject.name}</div>
            <div className="text-[13px] text-slate-500">
              {subject.gender} · {subject.age} 岁 · {subject.phone}
            </div>
            <div className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11.5px] text-slate-500">{subject.sc}</div>
          </div>
        </Card>
      </div>

      <Section title="参加中的研究">
        <Card className="overflow-hidden">
          <div className="hero-mesh px-4 py-3.5 text-white">
            <div className="text-[15.5px] font-semibold">{study.title}</div>
            <div className="text-[12px] text-white/70">
              {study.code} · 申办方 {study.sponsor}
            </div>
          </div>
          <Row icon={<IconTile className="bg-indigo-50 text-indigo-600"><FileText size={17} /></IconTile>} title="知情同意书副本" sub="随时可查看" right={<ChevronRight size={17} className="text-slate-300" />} onClick={() => nav('/consent')} />
          <Row icon={<IconTile className="bg-brand-50 text-brand-600"><Building2 size={17} /></IconTile>} title={site.name} sub={`${site.address} · ${site.hours}`} />
          <Row icon={<IconTile className="bg-amber-50 text-amber-600"><Bell size={17} /></IconTile>} title="提醒设置" sub="到访前一天 20:00 · 日记早晚提醒" right={<ChevronRight size={17} className="text-slate-300" />} last />
        </Card>
      </Section>

      <Section title="补偿" action={<span className="text-[13px] font-semibold text-slate-900">合计 ¥{total}</span>}>
        <Card className="overflow-hidden">
          {study.compensation.map((c, i) => (
            <Row key={c.item} icon={<IconTile className="bg-emerald-50 text-emerald-600"><Wallet size={17} /></IconTile>} title={c.item} right={<span className="text-[15px] font-semibold tabular-nums text-slate-900">¥{c.amount}</span>} last={i === study.compensation.length - 1} />
          ))}
        </Card>
      </Section>

      <Section title="联系研究团队">
        <Card className="overflow-hidden">
          {contacts.map((c, i) => (
            <Row
              key={c.phone}
              icon={<IconTile className={cx(c.role.includes('紧急') ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600')}><Phone size={17} /></IconTile>}
              title={`${c.role} · ${c.name}`}
              sub={c.hint}
              right={<span className="font-mono text-[12.5px] text-brand-600">{c.phone}</span>}
              last={i === contacts.length - 1}
            />
          ))}
        </Card>
      </Section>

      <div className="px-4 pt-6">
        <button onClick={() => setWithdraw(true)} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-[14.5px] font-semibold text-rose-500 shadow-sm">
          <LogOut size={16} />
          退出研究
        </button>
        <div className="mt-2 text-center text-[11.5px] text-slate-400">这是你的权利，随时可以，不需要说明理由</div>
      </div>

      <Sheet open={withdraw} onClose={() => setWithdraw(false)} title="确定要退出研究吗？">
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" />
          <div className="text-[13px] leading-relaxed text-slate-600">退出不会影响你的任何权益，已发放的补偿不会收回。为了你的安全，研究医生可能会请你回中心做一次简单的皮肤检查。</div>
        </div>
        <Btn tone="danger" className="mt-4 w-full" onClick={() => { setWithdraw(false); actions.notify('退出申请已提交', '研究协调员会尽快与你联系确认'); }}>
          确认提交退出申请
        </Btn>
        <Btn tone="ghost" className="mt-2 w-full" onClick={() => setWithdraw(false)}>
          我再想想
        </Btn>
      </Sheet>
    </Page>
  );
}
