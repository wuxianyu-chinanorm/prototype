import { getActiveScope, getScopeDataPanel } from "./scope";

/** 标题区装饰 + 面板卡片化 */
export function applyClarityLayout(host: HTMLElement) {
  const scope = getActiveScope(host);
  if (!scope) return;

  const header = scope.querySelector(".page-header");
  const h1 = header?.querySelector("h1");
  if (h1 && !h1.querySelector(".kis-clarity-eyebrow")) {
    const eyebrow = document.createElement("span");
    eyebrow.className = "kis-clarity-eyebrow";
    eyebrow.setAttribute("data-kis-enhanced", "inject");
    eyebrow.textContent = "工作台";
    h1.prepend(eyebrow);
  }

  const panel = getScopeDataPanel(scope);
  if (panel) panel.classList.add("kis-clarity-panel");

  const actions = header?.querySelector(".page-actions");
  if (actions) actions.classList.add("kis-page-actions--clarity");
}
