import { getScopeDataPanel, getScopeTableBody, getActiveScope } from "./scope";

function countBadges(scope: HTMLElement, sel: string) {
  return scope.querySelectorAll(sel).length;
}

/** 控制塔 KPI 条：插在 data-panel 前 */
export function injectBeaconOpsStrip(host: HTMLElement) {
  const scope = getActiveScope(host);
  const panel = getScopeDataPanel(scope);
  if (!scope || !panel || scope.querySelector(".kis-beacon-ops")) return;

  const tbody = getScopeTableBody(scope);
  const rows = tbody ? tbody.querySelectorAll("tr:not([hidden])").length : 0;
  const pending = countBadges(scope, ".badge-cell--warn");
  const ready = countBadges(scope, ".badge-cell--ok");

  const strip = document.createElement("div");
  strip.className = "kis-beacon-ops";
  strip.setAttribute("data-kis-enhanced", "inject");
  strip.innerHTML = `
    <article class="kis-beacon-ops__card kis-beacon-ops__card--primary">
      <span class="kis-beacon-ops__label">队列</span>
      <strong class="kis-beacon-ops__value">${rows}</strong>
      <span class="kis-beacon-ops__hint">当前列表</span>
    </article>
    <article class="kis-beacon-ops__card kis-beacon-ops__card--warn">
      <span class="kis-beacon-ops__label">待处理</span>
      <strong class="kis-beacon-ops__value">${pending}</strong>
      <span class="kis-beacon-ops__hint">需跟进</span>
    </article>
    <article class="kis-beacon-ops__card kis-beacon-ops__card--ok">
      <span class="kis-beacon-ops__label">正常</span>
      <strong class="kis-beacon-ops__value">${ready}</strong>
      <span class="kis-beacon-ops__hint">已就绪</span>
    </article>
    <div class="kis-beacon-ops__live" aria-hidden="true">
      <span class="kis-beacon-ops__pulse"></span>
      现场同步
    </div>
  `;
  panel.before(strip);
}

export function enhanceBeaconRowHeat(scope: HTMLElement | null) {
  if (!scope) return;
  scope.querySelectorAll("table tbody tr").forEach((row) => {
    row.classList.remove("kis-row--heat-warn", "kis-row--heat-err");
    if (row.querySelector(".badge-cell--err")) row.classList.add("kis-row--heat-err");
    else if (row.querySelector(".badge-cell--warn")) row.classList.add("kis-row--heat-warn");
  });
}

export function layoutBeaconPageHeader(scope: HTMLElement | null) {
  const header = scope?.querySelector(".page-header");
  const actions = header?.querySelector(".page-actions");
  if (actions) actions.classList.add("kis-page-actions--beacon");
}
