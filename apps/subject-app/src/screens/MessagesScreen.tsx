import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, BellRing, Info } from 'lucide-react';
import type { Message } from '../domain/types';
import { useApp } from '../store/AppStore';
import { Card, cx, NavBar, Page } from '../ui/kit';

const KIND: Record<Message['kind'], { icon: ReactNode; cls: string }> = {
  reminder: { icon: <BellRing size={17} />, cls: 'bg-brand-50 text-brand-600' },
  info: { icon: <Info size={17} />, cls: 'bg-indigo-50 text-indigo-600' },
  alert: { icon: <AlertTriangle size={17} />, cls: 'bg-rose-50 text-rose-600' },
};

export function MessagesScreen() {
  const { content, actions } = useApp();
  useEffect(() => {
    const t = window.setTimeout(actions.markRead, 800);
    return () => window.clearTimeout(t);
  }, [actions]);

  return (
    <Page>
      <NavBar title="消息" />
      <div className="space-y-2.5 px-4 pt-4">
        {content.messages.map((m) => (
          <Card key={m.id} className="flex gap-3 p-4">
            <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', KIND[m.kind].cls)}>{KIND[m.kind].icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-slate-900">{m.title}</span>
                <span className="shrink-0 text-[11.5px] text-slate-400">{m.at}</span>
              </div>
              <div className="mt-1 text-[13px] leading-relaxed text-slate-600">{m.body}</div>
            </div>
            {m.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
          </Card>
        ))}
      </div>
    </Page>
  );
}
