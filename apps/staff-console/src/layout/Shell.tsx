import { Outlet } from 'react-router-dom';
import { BackToKis } from '../ui/BackToKis';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastHost } from './ToastHost';

export function Shell() {
  return (
    <div className="flex h-full overflow-hidden bg-[radial-gradient(1200px_500px_at_70%_-10%,rgba(20,184,166,.08),transparent),radial-gradient(900px_400px_at_10%_-20%,rgba(99,102,241,.07),transparent)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto max-w-[1480px] px-8 pt-6 pb-16">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastHost />
      <BackToKis />
    </div>
  );
}
