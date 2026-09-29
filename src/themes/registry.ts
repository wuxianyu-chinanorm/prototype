/**
 * KIS 工作台风格注册表（元数据）。
 *
 * 加风格四步：
 * 1. src/styles/themes/<id>.css — 视觉令牌与组件覆盖
 * 2. src/styles/themes/index.css @import
 * 3. src/themes/presentation/<id>.ts — 可选布局/展示增强（classic 跳过）
 * 4. 本数组加一项；apply 走 src/themes/engine.ts
 *
 * 仅 KIS 主文档；访视中枢 / 受试者 / 开源参考 iframe 不参与。
 */
export const KIS_THEME_STORAGE_KEY = "kis-theme";

export const KIS_THEMES = [
  {
    id: "classic",
    label: "经典",
    english: "Classic",
    hint: "当前工作台",
  },
  {
    id: "beacon",
    label: "Beacon",
    english: "Beacon",
    hint: "访视中枢",
  },
  {
    id: "clarity",
    label: "Clarity",
    english: "Clarity",
    hint: "空气感工作台",
  },
  {
    id: "atlas",
    label: "Atlas",
    english: "Atlas",
    hint: "企业合规台",
  },
  {
    id: "lumen",
    label: "Lumen",
    english: "Lumen",
    hint: "交互数据网格",
  },
  {
    id: "notion",
    label: "Notion",
    english: "Notion",
    hint: "文档 · 数据库",
  },
] as const;

export type KisThemeId = (typeof KIS_THEMES)[number]["id"];

export function isKisThemeId(value: string | null): value is KisThemeId {
  return KIS_THEMES.some((theme) => theme.id === value);
}

export function readKisTheme(): KisThemeId {
  try {
    const stored = localStorage.getItem(KIS_THEME_STORAGE_KEY);
    if (isKisThemeId(stored)) return stored;
  } catch {
    /* private mode */
  }
  return "classic";
}

export { applyKisTheme } from "./engine";
