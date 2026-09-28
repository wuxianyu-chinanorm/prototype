import { useLocation } from 'react-router-dom';
import { Bell, FastForward, MapPin, Pause, Play, Search } from 'lucide-react';
import { tourAnchor } from '@vfp/guided-tour';
import { useStore } from '../store/StoreProvider';
import { hm } from '../domain/time';
import { HelpMenu } from '../tour/HelpMenu';
import { cx } from '../ui/kit';

const TITLES: [string, string][] = [
  ['/arrivals', '到访签到'],
  ['/stations', '工位执行'],
  ['/visits', '访视详情'],
  ['/eligibility', '入排判定'],
  ['/guides', '导检编排'],
  ['/exceptions', '异常中心'],
  ['/subjects', '项目与受试者'],
];

export function Topbar() {
  const { pathname } = useLocation();
  const { data } = useStore();
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? '今日总览';
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/70 bg-white/70 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        <MapPin className="size-3.5" />
        {data.site.site.name}
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900">{title}</span>
      </div>
      <div className="ml-6 hidden h-9 w-[320px] items-center gap-2 rounded-[10px] bg-slate-100/80 px-3 text-[13px] text-slate-400 ring-1 ring-inset ring-slate-200/60 xl:flex">
        <Search className="size-4" />
        搜索受试者姓名、手机尾号、签到号…
        <kbd className="ml-auto rounded bg-white px-1.5 font-mono text-[10.5px] text-slate-500 ring-1 ring-slate-200">⌘K</kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DemoClock />
        <button type="button" className="relative grid size-9 place-items-center rounded-[10px] text-slate-500 hover:bg-slate-100">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <HelpMenu />
      </div>
    </header>
  );
}

function DemoClock() {
  const { now, running, advance, toggleClock, data } = useStore();
  const sec = String(Math.floor(now % 60)).padStart(2, '0');
  return (
    <div {...tourAnchor('demo-clock')} className="flex h-9 items-center gap-1 rounded-[10px] bg-white pl-3 pr-1 ring-1 ring-slate-200 shadow-sm">
      <span className={cx('size-1.5 rounded-full', running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
      <span className="ml-1 text-[11px] text-slate-400">
        {data.site.today.slice(5).replace('-', '/')} {data.site.weekday}
      </span>
      <span className="ml-1 font-mono text-[14px] font-semibold tabular-nums text-slate-900">
        {hm(now)}
        <span className="text-slate-400">:{sec}</span>
      </span>
      <div className="ml-2 flex items-center gap-0.5 border-l border-slate-100 pl-1">
        <button type="button" onClick={toggleClock} title={running ? '暂停时钟' : '继续'} className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button type="button" onClick={() => advance(300)} className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium text-slate-600 hover:bg-slate-100">
          <FastForward className="size-3.5" />5 分钟
        </button>
        <button type="button" onClick={() => advance(900)} className="h-7 rounded-md px-1.5 text-[11.5px] font-medium text-slate-600 hover:bg-slate-100">
          +15
        </button>
      </div>
    </div>
  );
}
