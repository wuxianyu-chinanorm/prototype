import { useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createLocalStorageProgressStore, TourProvider, type TourCatalog, type TourEvent } from '@vfp/guided-tour';

/** 把通用导览引擎接到本应用：路由适配 + 进度存储 + 埋点出口 */
export function TourBridge({ catalog, children }: { catalog: TourCatalog; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useMemo(() => createLocalStorageProgressStore('vfp.staff.tours.v1'), []);
  const onEvent = (e: TourEvent) => console.debug('[tour]', e);
  return (
    <TourProvider catalog={catalog} pathname={location.pathname} navigate={navigate} progressStore={store} onEvent={onEvent}>
      {children}
    </TourProvider>
  );
}
