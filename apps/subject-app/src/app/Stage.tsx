import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createLocalStorageProgressStore, TourProvider, type TourCatalog, type TourEvent } from '@vfp/guided-tour';
import { DemoPanel } from '../demo/DemoPanel';
import { NotesPanel } from '../demo/NotesPanel';
import { Banner } from '../device/Banner';
import { PhoneFrame } from '../device/PhoneFrame';
import { hm } from '../domain/time';
import { useApp } from '../store/AppStore';
import { ScreenHostContext } from '../ui/kit';
import { BackToKis } from '../ui/BackToKis';
import { TabBar } from '../ui/TabBar';
import { PhoneRoutes } from './PhoneRoutes';

/**
 * 演示舞台：左侧演示控制台 · 中间手机 · 右侧产品批注。
 * 导览引擎的浮层被限定在手机屏幕内（container = 屏幕节点），控制台和批注不受遮挡。
 */
export function Stage({ tours }: { tours: TourCatalog }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { now, scenario } = useApp();
  const lightStatus = ['/pass', '/welcome'].includes(location.pathname) || (location.pathname === '/result' && scenario.enrollment === 'enrolled');
  const [screen, setScreen] = useState<HTMLDivElement | null>(null);
  const store = useMemo(() => createLocalStorageProgressStore('vfp.subject.tours.v1'), []);
  const onEvent = (e: TourEvent) => console.debug('[tour]', e);

  return (
    <TourProvider
      catalog={tours}
      pathname={location.pathname}
      navigate={navigate}
      progressStore={store}
      container={screen}
      autoStartDelayMs={700}
      onEvent={onEvent}
    >
      <BackToKis />
      <div className="flex h-full items-center justify-center gap-10 px-8">
        <DemoPanel />
        <PhoneFrame clock={hm(now)} lightStatus={lightStatus} screenRef={setScreen}>
          <ScreenHostContext.Provider value={screen}>
            <PhoneRoutes />
            <TabBar />
            <Banner />
          </ScreenHostContext.Provider>
        </PhoneFrame>
        <NotesPanel />
      </div>
    </TourProvider>
  );
}
