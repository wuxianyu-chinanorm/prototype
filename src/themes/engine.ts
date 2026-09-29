import { getPresentationModule } from "./presentation";
import { KIS_THEME_STORAGE_KEY, KIS_THEMES, type KisThemeId } from "./registry";

let unmountPresentation: (() => void) | null = null;

function setThemeAttribute(id: KisThemeId) {
  if (id === "classic") document.documentElement.removeAttribute("data-kis-theme");
  else document.documentElement.setAttribute("data-kis-theme", id);
}

function mountPresentation(id: KisThemeId) {
  unmountPresentation?.();
  unmountPresentation = null;

  const mod = getPresentationModule(id);
  if (!mod) return;

  const host = document.getElementById("kis-prototype-host");
  if (!host) return;

  unmountPresentation = mod.mount(host);
}

/** 应用风格：CSS 属性 + 可选展示层。仅 KIS 主文档。 */
export function applyKisTheme(id: KisThemeId): KisThemeId {
  const theme = KIS_THEMES.find((item) => item.id === id) ?? KIS_THEMES[0];

  setThemeAttribute(theme.id);
  try {
    localStorage.setItem(KIS_THEME_STORAGE_KEY, theme.id);
  } catch {
    /* private mode */
  }

  mountPresentation(theme.id);
  window.dispatchEvent(new CustomEvent("kis-theme-change", { detail: { id: theme.id } }));

  return theme.id;
}

/** 首屏：HTML inline script 已写 attribute 时，补挂载展示层 */
export function hydrateKisThemePresentation(readId: () => KisThemeId) {
  mountPresentation(readId());
}

export function teardownKisThemePresentation() {
  unmountPresentation?.();
  unmountPresentation = null;
}
