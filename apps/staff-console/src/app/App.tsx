import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import type { TourCatalog } from '@vfp/guided-tour';
import { loadSeed, loadTours } from '../data/repository';
import type { Seed } from '../domain/types';
import { StoreProvider } from '../store/StoreProvider';
import { TourBridge } from '../tour/TourBridge';
import { Shell } from '../layout/Shell';
import { OverviewPage } from '../pages/overview/OverviewPage';
import { ArrivalsPage } from '../pages/arrivals/ArrivalsPage';
import { StationsPage } from '../pages/stations/StationsPage';
import { VisitDetailPage } from '../pages/visit/VisitDetailPage';
import { EligibilityPage } from '../pages/eligibility/EligibilityPage';
import { GuideBuilderPage } from '../pages/guide/GuideBuilderPage';
import { ExceptionsPage } from '../pages/exceptions/ExceptionsPage';
import { SubjectsPage } from '../pages/subjects/SubjectsPage';

type Boot = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; seed: Seed; tours: TourCatalog };

export function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' });

  useEffect(() => {
    Promise.all([loadSeed(), loadTours()])
      .then(([seed, tours]) => setBoot({ status: 'ready', seed, tours }))
      .catch((e: unknown) => setBoot({ status: 'error', message: e instanceof Error ? e.message : String(e) }));
  }, []);

  if (boot.status === 'loading') {
    return (
      <div className="grid h-full place-items-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="size-2 animate-ping rounded-full bg-teal-500" />
          正在载入今日现场…
        </div>
      </div>
    );
  }
  if (boot.status === 'error') {
    return <div className="grid h-full place-items-center text-sm text-rose-600">{boot.message}</div>;
  }

  return (
    <StoreProvider seed={boot.seed}>
      <BrowserRouter basename={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/staff`}>
        <TourBridge catalog={boot.tours}>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<OverviewPage />} />
              <Route path="arrivals" element={<ArrivalsPage />} />
              <Route path="stations" element={<StationsPage />} />
              <Route path="stations/:stationId" element={<StationsPage />} />
              <Route path="visits/:visitId" element={<VisitDetailPage />} />
              <Route path="eligibility" element={<EligibilityPage />} />
              <Route path="eligibility/:visitId" element={<EligibilityPage />} />
              <Route path="guides" element={<GuideBuilderPage />} />
              <Route path="exceptions" element={<ExceptionsPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
            </Route>
          </Routes>
        </TourBridge>
      </BrowserRouter>
    </StoreProvider>
  );
}
