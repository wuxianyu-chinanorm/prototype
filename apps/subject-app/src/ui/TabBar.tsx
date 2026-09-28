import { CalendarCheck2, House, NotebookPen, QrCode, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tourAnchor } from '@vfp/guided-tour';
import { useApp } from '../store/AppStore';
import { cx } from './kit';

const TAB_ROUTES = ['/home', '/today', '/pass', '/diary', '/me', '/schedule'];
export const isTabRoute = (p: string) => TAB_ROUTES.includes(p);

export function TabBar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { scenario } = useApp();
  if (!isTabRoute(pathname)) return null;
  const live = !!scenario.checkin && !scenario.checkedOut;

  const item = (to: string, label: string, Icon: typeof House, dot?: boolean) => {
    const on = pathname === to || (to === '/home' && pathname === '/schedule');
    return (
      <button key={to} onClick={() => nav(to)} className={cx('relative flex flex-1 flex-col items-center gap-1 pt-2 text-[10.5px] font-medium', on ? 'text-brand-600' : 'text-slate-400')}>
        <Icon size={24} strokeWidth={on ? 2.3 : 1.9} />
        {label}
        {dot && <span className="absolute right-[26%] top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
      </button>
    );
  };

  return (
    <div className="glass absolute inset-x-0 bottom-0 z-40 flex h-[88px] items-start border-t border-black/5 px-2">
      {item('/home', '首页', House)}
      {item('/today', '今日', CalendarCheck2, live)}
      <div className="flex flex-1 justify-center">
        <button
          {...tourAnchor('tab-pass')}
          onClick={() => nav('/pass')}
          className={cx(
            'hero-mesh -mt-5 grid h-[60px] w-[60px] place-items-center rounded-[22px] text-white shadow-[0_12px_24px_-8px_rgba(15,118,110,0.7)] ring-4 ring-white transition active:scale-95',
            pathname === '/pass' && 'ring-brand-100',
          )}
        >
          <QrCode size={28} strokeWidth={2} />
        </button>
      </div>
      {item('/diary', '日记', NotebookPen)}
      {item('/me', '我的', UserRound)}
    </div>
  );
}
