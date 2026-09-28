/**
 * 导览引擎的领域模型。纯数据，不依赖 DOM / React / 业务。
 * 业务方只需要提供符合 TourCatalog 的 JSON。
 */

export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStepDef {
  id: string;
  /** 目标锚点，对应 DOM 上的 data-tour="<target>"；缺省则居中展示 */
  target?: string;
  title: string;
  /** 正文，\n 分段 */
  body: string;
  placement?: Placement;
  /** 进入这一步前需要所在的路由（具体路径） */
  route?: string;
  /** next：点按钮推进；targetClick：点击高亮区域推进 */
  advanceOn?: 'next' | 'targetClick';
  /** 高亮区域外扩像素 */
  padding?: number;
  /** 底部补充提示，例如业务规则 */
  hint?: string;
}

export type TourTrigger =
  | { type: 'firstVisit'; route: string }
  | { type: 'manual' };

export interface TourDef {
  id: string;
  title: string;
  summary: string;
  /** 在帮助菜单里的分组 */
  group?: string;
  trigger: TourTrigger;
  steps: TourStepDef[];
}

export interface TourCatalog {
  version: number;
  tours: TourDef[];
}

export type TourEvent =
  | { type: 'started'; tourId: string }
  | { type: 'step'; tourId: string; stepId: string; index: number }
  | { type: 'completed'; tourId: string }
  | { type: 'dismissed'; tourId: string; atStep: string };

export interface TourLabels {
  next: string;
  prev: string;
  done: string;
  skip: string;
  clickHint: string;
  stepOf: (current: number, total: number) => string;
}

export const defaultLabels: TourLabels = {
  next: '下一步',
  prev: '上一步',
  done: '完成',
  skip: '跳过导览',
  clickHint: '点击高亮区域继续',
  stepOf: (c, t) => `${c} / ${t}`,
};
