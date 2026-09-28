/** 返回 KIS 主原型 · 访视执行阶段 */
export function BackToKis() {
  return (
    <a
      href={`${import.meta.env.BASE_URL}?phase=visit-collect`}
      className="group fixed bottom-6 left-6 z-[80] inline-flex items-center gap-2.5 rounded-2xl bg-[#0a1120]/92 px-3.5 py-2.5 text-[13px] font-medium text-white shadow-[0_18px_40px_-18px_rgba(10,17,32,.85)] ring-1 ring-white/10 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#0f1a30] hover:ring-teal-400/40"
    >
      <span className="grid size-7 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 text-white shadow-[0_8px_16px_-8px_rgba(20,184,166,.9)]">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </span>
      <span className="pr-1">
        <span className="block leading-tight">返回 KIS</span>
        <span className="block text-[11px] font-normal text-slate-400 group-hover:text-teal-300/90">访视执行 · 作业台</span>
      </span>
    </a>
  );
}
