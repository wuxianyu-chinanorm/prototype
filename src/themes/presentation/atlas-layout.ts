import { getActiveScope, getScopeDataPanel, getScopeTableBody } from "./scope";

export function injectAtlasComplianceRibbon(host: HTMLElement) {
  const scope = getActiveScope(host);
  const panel = getScopeDataPanel(scope);
  if (!panel || panel.querySelector(".kis-atlas-ribbon")) return;

  const ribbon = document.createElement("div");
  ribbon.className = "kis-atlas-ribbon";
  ribbon.setAttribute("data-kis-enhanced", "inject");
  ribbon.innerHTML = `
    <span class="kis-atlas-ribbon__mark" aria-hidden="true">✓</span>
    <span class="kis-atlas-ribbon__text">审计视图 · 只读展示层，操作仍走原按钮</span>
  `;
  panel.prepend(ribbon);
}

export function injectAtlasHeaderMetrics(host: HTMLElement) {
  const scope = getActiveScope(host);
  const header = scope?.querySelector(".page-header");
  if (!header || header.querySelector(".kis-atlas-metrics")) return;

  const tbody = getScopeTableBody(scope);
  const rows = tbody ? tbody.querySelectorAll("tr:not([hidden])").length : 0;
  const pending = scope ? scope.querySelectorAll(".badge-cell--warn, .badge-cell--err").length : 0;

  const grid = document.createElement("div");
  grid.className = "kis-atlas-metrics";
  grid.setAttribute("data-kis-enhanced", "inject");
  grid.innerHTML = `
    <div class="kis-atlas-metrics__cell">
      <span class="kis-atlas-metrics__n">${rows}</span>
      <span class="kis-atlas-metrics__l">记录</span>
    </div>
    <div class="kis-atlas-metrics__cell kis-atlas-metrics__cell--alert">
      <span class="kis-atlas-metrics__n">${pending}</span>
      <span class="kis-atlas-metrics__l">需关注</span>
    </div>
  `;
  header.append(grid);
  header.classList.add("kis-page-header--atlas-split");
}

export function wireAtlasSegmentFilter(bar: HTMLElement, scope: HTMLElement) {
  if (bar.dataset.kisWired === "1") return;
  bar.dataset.kisWired = "1";

  const tbody = getScopeTableBody(scope);
  if (!tbody) return;

  const items = bar.querySelectorAll<HTMLButtonElement>(".kis-segment-bar__item");
  const filter = (mode: "all" | "ok" | "warn" | "err") => {
    tbody.querySelectorAll("tr").forEach((row) => {
      if (mode === "all") {
        row.hidden = false;
        return;
      }
      const sel =
        mode === "ok" ? ".badge-cell--ok" : mode === "warn" ? ".badge-cell--warn" : ".badge-cell--err";
      row.hidden = !row.querySelector(sel);
    });
  };

  const modes: Array<"all" | "ok" | "warn" | "err"> = ["all", "ok", "warn", "err"];
  items.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      items.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      filter(modes[i] ?? "all");
    });
  });
}

export function markAtlasTable(scope: HTMLElement | null) {
  scope?.querySelectorAll("table").forEach((table) => table.classList.add("kis-atlas-table"));
}
