import {
  BadgeCheck, Camera, Circle, ClipboardList, Droplets, FileSignature, Flag, FlaskConical, Gauge, GraduationCap, IdCard,
  NotebookPen, Package, PackageOpen, Scale, ScanFace, ShieldAlert, Smile, Stethoscope, Thermometer, type LucideIcon,
} from 'lucide-react';

/** 数据里用字符串指代图标，这里是唯一映射表 */
const map: Record<string, LucideIcon> = {
  'badge-check': BadgeCheck,
  camera: Camera,
  'clipboard-list': ClipboardList,
  droplets: Droplets,
  'file-signature': FileSignature,
  flag: Flag,
  'flask-conical': FlaskConical,
  gauge: Gauge,
  'graduation-cap': GraduationCap,
  'id-card': IdCard,
  'notebook-pen': NotebookPen,
  package: Package,
  'package-open': PackageOpen,
  scale: Scale,
  'scan-face': ScanFace,
  'shield-alert': ShieldAlert,
  smile: Smile,
  stethoscope: Stethoscope,
  thermometer: Thermometer,
};

export function StepIcon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const I = map[name] ?? Circle;
  return <I size={size} className={className} strokeWidth={1.9} />;
}
