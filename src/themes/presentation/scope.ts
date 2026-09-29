/** 主内容区里当前展示的阶段页（非 hidden / 非 is-hidden） */
export function getVisiblePage(host: HTMLElement): HTMLElement | null {
  const main = host.querySelector("#main-content") ?? host;
  for (const page of main.querySelectorAll<HTMLElement>(":scope > [id^='page-']")) {
    if (isElementVisible(page)) return page;
  }
  return null;
}

function isElementVisible(el: HTMLElement): boolean {
  if (el.hidden) return false;
  if (el.classList.contains("is-hidden")) return false;
  if (el.id === "page-placeholder" && !el.classList.contains("is-visible")) return false;
  if (el.id === "page-placeholder") return false;
  return true;
}

/** 当前可见的业务面板（招募 / 访视 / tab 等）— 只在可见阶段页内查找 */
export function getActiveScope(host: HTMLElement): HTMLElement | null {
  const page = getVisiblePage(host);
  if (!page) return null;

  return (
    page.querySelector<HTMLElement>(".visit-collect-panel.is-active") ??
    page.querySelector<HTMLElement>(".recruit-view-panel.is-active") ??
    page.querySelector<HTMLElement>(".prep-view-panel.is-active") ??
    page.querySelector<HTMLElement>(".deliver-view-panel.is-active") ??
    page.querySelector<HTMLElement>(".deliver-view-panel:not(.is-hidden)") ??
    page.querySelector<HTMLElement>(".tab-panel.is-active") ??
    page
  );
}

export function getScopeDataPanel(scope: HTMLElement | null): HTMLElement | null {
  if (!scope) return null;
  return scope.querySelector<HTMLElement>(".data-panel");
}

export function getScopeTableBody(scope: HTMLElement | null): HTMLTableSectionElement | null {
  if (!scope) return null;
  return scope.querySelector<HTMLTableSectionElement>("table tbody");
}
