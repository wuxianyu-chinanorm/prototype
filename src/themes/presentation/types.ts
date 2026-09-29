import type { KisThemeId } from "../registry";

export type ThemeUnmount = () => void;

/** 非 classic 风格的可选 DOM 增强（布局/装饰/状态展示），与 legacy 运行时解耦。 */
export interface ThemePresentationModule {
  id: Exclude<KisThemeId, "classic">;
  mount: (host: HTMLElement) => ThemeUnmount;
}
