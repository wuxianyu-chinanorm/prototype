import { useEffect, useState, type ReactNode } from 'react';
import { BatteryFull, Signal, Wifi } from 'lucide-react';

export const SCREEN_W = 390;
export const SCREEN_H = 844;
const BEZEL = 12;

/** 按窗口高度缩放整台手机，保证 1:1 的 iPhone 逻辑尺寸在小屏上也能完整显示 */
function useFitScale(): number {
  const calc = () => Math.min(1, (window.innerHeight - 40) / (SCREEN_H + BEZEL * 2));
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const on = () => setScale(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return scale;
}

export function PhoneFrame({ clock, lightStatus, screenRef, children }: { clock: string; lightStatus?: boolean; screenRef: (el: HTMLDivElement | null) => void; children: ReactNode }) {
  const scale = useFitScale();
  const w = SCREEN_W + BEZEL * 2;
  const h = SCREEN_H + BEZEL * 2;
  return (
    <div style={{ width: w * scale, height: h * scale }} className="shrink-0">
      <div
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', padding: BEZEL }}
        className="relative rounded-[62px] bg-[#0b0d12] shadow-[0_0_0_2px_#2a2f3a,0_0_0_5px_#0b0d12,0_50px_100px_-30px_rgba(15,23,42,0.55),inset_0_0_2px_rgba(255,255,255,0.3)]"
      >
        <span className="absolute -left-[5px] top-[150px] h-8 w-[5px] rounded-l bg-[#1b1f28]" />
        <span className="absolute -left-[5px] top-[205px] h-14 w-[5px] rounded-l bg-[#1b1f28]" />
        <span className="absolute -left-[5px] top-[272px] h-14 w-[5px] rounded-l bg-[#1b1f28]" />
        <span className="absolute -right-[5px] top-[230px] h-20 w-[5px] rounded-r bg-[#1b1f28]" />
        <div ref={screenRef} className="relative h-full w-full overflow-hidden rounded-[50px] bg-[#f5f6f8]" style={{ isolation: 'isolate' }}>
          {children}
          <StatusBar clock={clock} light={lightStatus} />
          <div className="pointer-events-none absolute left-1/2 top-[11px] z-[80] h-[35px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-[80] h-[5px] w-[136px] -translate-x-1/2 rounded-full bg-slate-900/80" />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ clock, light }: { clock: string; light?: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 top-0 z-[70] flex h-[54px] items-center justify-between px-8 pt-1 text-[15px] font-semibold transition-colors ${light ? 'text-white' : 'text-slate-900'}`}>
      <span className="w-16 text-center tabular-nums">{clock}</span>
      <span className="flex items-center gap-1.5">
        <Signal size={16} strokeWidth={2.6} />
        <Wifi size={16} strokeWidth={2.6} />
        <BatteryFull size={22} strokeWidth={2} />
      </span>
    </div>
  );
}
