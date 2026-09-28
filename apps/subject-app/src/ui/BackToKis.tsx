/** 返回 KIS 主原型 · 访视执行阶段 */
export function BackToKis() {
  return (
    <a
      href={`${import.meta.env.BASE_URL}?phase=visit-collect`}
      className="group fixed top-5 left-5 z-[80] inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-[0_10px_30px_-12px_rgba(15,23,42,.45)] ring-1 ring-slate-200/80 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white hover:text-teal-800 hover:ring-teal-200"
    >
      <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-white transition group-hover:bg-teal-600">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 3 5 8l5 5" />
        </svg>
      </span>
      <span>
        返回 KIS
        <span className="ml-1.5 text-[11px] font-normal text-slate-400 group-hover:text-teal-600/80">访视执行</span>
      </span>
    </a>
  );
}
