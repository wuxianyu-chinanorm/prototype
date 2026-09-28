import {
  BadgeCheck, Camera, ClipboardList, Droplets, FileSignature, FlaskConical, Flag, Gauge, GraduationCap, IdCard,
  Lamp, Layers, NotebookPen, Package, PackageOpen, Scale, ScanFace, SearchCheck, ShieldAlert, Smile, Stethoscope,
  Thermometer, Circle, type LucideIcon,
} from 'lucide-react';

/** 数据里用字符串指代图标，这里是唯一映射表 */
const map: Record<string, LucideIcon> = {
  'file-signature': FileSignature,
  'badge-check': BadgeCheck,
  'id-card': IdCard,
  stethoscope: Stethoscope,
  'clipboard-list': ClipboardList,
  droplets: Droplets,
  layers: Layers,
  thermometer: Thermometer,
  'flask-conical': FlaskConical,
  lamp: Lamp,
  gauge: Gauge,
  scale: Scale,
  camera: Camera,
  'scan-face': ScanFace,
  smile: Smile,
  'shield-alert': ShieldAlert,
  'notebook-pen': NotebookPen,
  'package-open': PackageOpen,
  'search-check': SearchCheck,
  package: Package,
  'graduation-cap': GraduationCap,
  flag: Flag,
};

export function StepIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Circle;
  return <Icon className={className} strokeWidth={1.9} />;
}
