import { useTour } from '../react/TourProvider';

interface Props {
  tourId: string;
  label?: string;
  className?: string;
}

/** 未看过的导览在页面上显示一个呼吸光点，点击即开始 */
export function TourHotspot({ tourId, label = '功能导览', className }: Props) {
  const { isSeen, start, active } = useTour();
  if (isSeen(tourId) || active) return null;
  return (
    <button
      type="button"
      className={className ? `gt-hotspot ${className}` : 'gt-hotspot'}
      aria-label={label}
      title={label}
      onClick={() => start(tourId)}
    >
      <span className="gt-hotspot__core" />
    </button>
  );
}
