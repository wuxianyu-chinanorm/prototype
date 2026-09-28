import { useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { TourCatalog } from '@vfp/guided-tour';
import { loadContent, loadTours } from '../data/repository';
import type { Content } from '../domain/types';
import { AppStoreProvider } from '../store/AppStore';
import { Stage } from './Stage';

type Boot = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; content: Content; tours: TourCatalog };

export function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });
  useEffect(() => {
    Promise.all([loadContent(), loadTours()])
      .then(([content, tours]) => setBoot({ status: 'ready', content, tours }))
      .catch((e: unknown) => setBoot({ status: 'error', message: e instanceof Error ? e.message : String(e) }));
  }, []);

  if (boot.status === 'loading') return <div className="grid h-full place-items-center text-sm text-slate-500">加载原型数据…</div>;
  if (boot.status === 'error') return <div className="grid h-full place-items-center text-sm text-rose-600">{boot.message}</div>;

  const initial = boot.content.scenarios.find((s) => s.id === 'eve') ?? boot.content.scenarios[0]!;
  return (
    <AppStoreProvider content={boot.content}>
      <MemoryRouter initialEntries={[initial.route]}>
        <Stage tours={boot.tours} />
      </MemoryRouter>
    </AppStoreProvider>
  );
}
