import { useApp } from '../store/AppStore';

/** iOS 风格的推送横幅：模拟系统推送（签到成功、筛选结果、改期确认…） */
export function Banner() {
  const { banner, actions } = useApp();
  if (!banner) return null;
  return (
    <div key={banner.id} className="absolute inset-x-2.5 top-[52px] z-[75]" style={{ animation: 'banner .45s cubic-bezier(.2,.9,.2,1.1) both' }}>
      <button
        onClick={actions.clearBanner}
        className="glass flex w-full items-start gap-3 rounded-[22px] px-3.5 py-3 text-left shadow-[0_18px_40px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5"
      >
        <div className="hero-mesh grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[13px] font-bold text-white">伙</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[12px] text-slate-500">
            <span className="font-medium uppercase tracking-wide">试验伙伴</span>
            <span>现在</span>
          </div>
          <div className="text-[14.5px] font-semibold text-slate-900">{banner.title}</div>
          {banner.body && <div className="text-[13px] leading-snug text-slate-600">{banner.body}</div>}
        </div>
      </button>
    </div>
  );
}
