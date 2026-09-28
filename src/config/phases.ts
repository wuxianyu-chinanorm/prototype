/** 顶栏阶段 IA（与原型 data-phase 一致） */
export type PhaseId =
  | "prep"
  | "schedule"
  | "recruit"
  | "visit-collect"
  | "quality"
  | "deliver"
  | "settings";

export const PHASES: { id: PhaseId; label: string }[] = [
  { id: "prep", label: "立项准备" },
  { id: "schedule", label: "执行调度" },
  { id: "recruit", label: "招募预约" },
  { id: "visit-collect", label: "访视执行" },
  { id: "quality", label: "质量审核" },
  { id: "deliver", label: "交付归档" },
  { id: "settings", label: "系统设置" },
];

export type VisitCollectViewId = "front-desk" | "guide-progress" | "crf-work";

export const VISIT_COLLECT_VIEWS: { id: VisitCollectViewId; label: string }[] = [
  { id: "front-desk", label: "前台登记" },
  { id: "guide-progress", label: "导检进度" },
  { id: "crf-work", label: "采集提交" },
];
