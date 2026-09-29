import { markEnhanced } from "./cleanup";
import { setNotionViewMode, type NotionViewMode } from "./notion-views";
import { getActiveScope, getScopeDataPanel } from "./scope";

const PAGE_EMOJI: Array<[RegExp, string]> = [
  [/前台|登记/i, "🛎️"],
  [/导检|进度/i, "🧭"],
  [/招募|计划/i, "📣"],
  [/预约/i, "📅"],
  [/筛选/i, "🔍"],
  [/访视|CRF/i, "📋"],
  [/交付|归档/i, "📦"],
  [/受理|调度/i, "🗂️"],
  [/设置/i, "⚙️"],
];

function pageEmoji(title: string) {
  for (const [re, em] of PAGE_EMOJI) {
    if (re.test(title)) return em;
  }
  return "📄";
}

function badgeNotionClass(el: Element): string {
  if (el.classList.contains("badge-cell--ok")) return "kis-notion-tag--green";
  if (el.classList.contains("badge-cell--warn")) return "kis-notion-tag--yellow";
  if (el.classList.contains("badge-cell--err")) return "kis-notion-tag--red";
  if (el.classList.contains("badge-cell--info")) return "kis-notion-tag--blue";
  return "kis-notion-tag--gray";
}

export type NotionScopeKind = "database" | "workspace";

/** 有 data-panel 内表格 → 数据库视图；CRF / EDC 等 → 文档工作台 */
export function getNotionScopeKind(scope: HTMLElement): NotionScopeKind {
  const table = scope.querySelector(".data-panel table");
  return table ? "database" : "workspace";
}

export function applyNotionChrome(host: HTMLElement) {
  const scope = getActiveScope(host);
  if (!scope || scope.querySelector(".kis-notion-hero")) return;

  const kind = getNotionScopeKind(scope);
  scope.classList.add("kis-notion-scope");
  scope.setAttribute("data-notion-scope-kind", kind);

  const header = scope.querySelector(".page-header");
  const panel = kind === "database" ? getScopeDataPanel(scope) : null;

  const hero = document.createElement("div");
  hero.className = kind === "workspace" ? "kis-notion-hero kis-notion-hero--workspace" : "kis-notion-hero";
  hero.setAttribute("data-kis-enhanced", "notion-hero");
  scope.prepend(hero);

  if (kind === "database") {
    const cover = document.createElement("div");
    cover.className = "kis-notion-cover";
    cover.setAttribute("data-kis-enhanced", "inject");
    hero.append(cover);
  }

  const heroInner = document.createElement("div");
  heroInner.className = "kis-notion-hero__inner";
  hero.append(heroInner);

  if (header) {
    heroInner.append(header);
    rebuildNotionHeader(header, kind);
  }

  if (kind === "database" && panel) {
    const doc = document.createElement("div");
    doc.className = "kis-notion-doc";
    doc.setAttribute("data-kis-enhanced", "notion-shell");
    hero.insertAdjacentElement("afterend", doc);
    wrapNotionDatabase(doc, panel);
  }

  injectNotionFab(host);
}

function rebuildNotionHeader(header: Element, kind: NotionScopeKind = "database") {
  header.classList.add("kis-notion-header");
  const h1 = header.querySelector("h1");
  const title = h1?.textContent?.trim() ?? "Untitled";
  if (h1 && !header.querySelector(".kis-notion-page-icon")) {
    const icon = document.createElement("div");
    icon.className = "kis-notion-page-icon";
    icon.setAttribute("data-kis-enhanced", "inject");
    icon.textContent = pageEmoji(title);
    header.prepend(icon);
    h1.classList.add("kis-notion-title");
  }
  header.querySelector(".subtitle")?.classList.add("kis-notion-subtitle");

  const actions = header.querySelector(".page-actions");
  if (actions) {
    actions.classList.add("kis-notion-actions");
    if (!actions.querySelector(".kis-notion-share-btn")) {
      const share = document.createElement("button");
      share.type = "button";
      share.className = "kis-notion-share-btn";
      share.setAttribute("data-kis-enhanced", "inject");
      share.textContent = "Share";
      actions.prepend(share);
    }
  }

  if (kind === "workspace") return;

  if (!header.querySelector(".kis-notion-props")) {
    const scope = header.closest(".kis-notion-scope");
    const table = scope?.querySelector("table tbody");
    const rows = table ? table.querySelectorAll("tr:not([hidden])").length : 0;
    const props = document.createElement("div");
    props.className = "kis-notion-props";
    props.setAttribute("data-kis-enhanced", "inject");
    props.innerHTML = `
      <div class="kis-notion-prop"><span class="kis-notion-prop__k">Type</span><span class="kis-notion-prop__v">Database</span></div>
      <div class="kis-notion-prop"><span class="kis-notion-prop__k">Rows</span><span class="kis-notion-prop__v">${rows}</span></div>
      <div class="kis-notion-prop"><span class="kis-notion-prop__k">Updated</span><span class="kis-notion-prop__v">Just now</span></div>
      <div class="kis-notion-prop"><span class="kis-notion-prop__k">Tags</span><span class="kis-notion-prop__v kis-notion-tag kis-notion-tag--gray">Workspace</span></div>
    `;
    header.append(props);
  }
}

function wrapNotionDatabase(doc: HTMLElement, panel: HTMLElement) {
  if (panel.parentElement?.classList.contains("kis-notion-db-shell")) return;

  const shell = document.createElement("div");
  shell.className = "kis-notion-db-shell";
  shell.setAttribute("data-kis-enhanced", "notion-wrap");
  doc.append(shell);
  shell.append(panel);

  if (!shell.querySelector(".kis-notion-db-chrome")) {
    const chrome = document.createElement("div");
    chrome.className = "kis-notion-db-chrome";
    chrome.setAttribute("data-kis-enhanced", "inject");
    chrome.innerHTML = `
      <div class="kis-notion-views" role="tablist">
        <button type="button" class="kis-notion-view is-active" data-notion-view="table">▦ Table</button>
        <button type="button" class="kis-notion-view" data-notion-view="board">▢ Board</button>
        <button type="button" class="kis-notion-view" data-notion-view="gallery">▤ Gallery</button>
      </div>
      <div class="kis-notion-db-tools">
        <button type="button" class="kis-notion-tool" tabindex="-1">Filter</button>
        <button type="button" class="kis-notion-tool" tabindex="-1">Sort</button>
        <button type="button" class="kis-notion-tool" tabindex="-1">⋯</button>
      </div>
    `;
    shell.prepend(chrome);

    chrome.querySelectorAll(".kis-notion-view").forEach((btn) => {
      btn.addEventListener("click", () => {
        chrome.querySelectorAll(".kis-notion-view").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const mode = (btn.getAttribute("data-notion-view") ?? "table") as NotionViewMode;
        const table = panel.querySelector("table");
        setNotionViewMode(shell, panel, table as HTMLTableElement | null, mode);
      });
    });
  }

  panel.classList.add("kis-notion-database");
  panel.querySelector(".data-panel__toolbar")?.classList.add("kis-notion-db-toolbar");
  panel.querySelector(".data-panel__quick-bar")?.classList.add("kis-notion-db-quick");

  const table = panel.querySelector("table");
  if (table) enhanceNotionTable(table as HTMLTableElement);
}

function enhanceNotionTable(table: HTMLTableElement) {
  table.classList.add("kis-notion-table");
  prependSelectColumn(table);
  stylizeBadges(table);
  stylizeTitleCells(table);
}

function prependSelectColumn(table: HTMLTableElement) {
  if (table.querySelector("th.kis-notion-select-col")) return;
  table.querySelectorAll("thead tr").forEach((tr) => {
    const th = document.createElement("th");
    th.className = "kis-notion-select-col";
    th.setAttribute("data-kis-enhanced", "notion-col");
    th.innerHTML = `<input type="checkbox" class="kis-notion-check" aria-label="全选" />`;
    tr.prepend(th);
  });
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const td = document.createElement("td");
    td.className = "kis-notion-select-col";
    td.setAttribute("data-kis-enhanced", "notion-col");
    td.innerHTML = `<input type="checkbox" class="kis-notion-check" aria-label="选择行" />`;
    tr.prepend(td);
  });
}

function stylizeBadges(table: HTMLTableElement) {
  table.querySelectorAll(".badge-cell").forEach((badge) => {
    if (badge.getAttribute("data-kis-notion-tag")) return;
    badge.setAttribute("data-kis-notion-tag", "1");
    badge.classList.add("kis-notion-tag", badgeNotionClass(badge));
  });
}

function stylizeTitleCells(table: HTMLTableElement) {
  const titleIdx = findTitleColumnIndex(table);
  if (titleIdx < 0) return;
  table.querySelectorAll("tbody tr").forEach((tr) => {
    const cell = tr.children[titleIdx] as HTMLElement | undefined;
    if (!cell || cell.getAttribute("data-kis-notion-title")) return;
    markEnhanced(cell, "notion-title");
    cell.classList.add("kis-notion-cell-title");
  });
}

function findTitleColumnIndex(table: HTMLTableElement): number {
  const headers = table.querySelectorAll("thead th");
  for (let i = 0; i < headers.length; i++) {
    const label = headers[i].textContent?.trim() ?? "";
    if (/姓名|名称|标题|研究名称|Account/i.test(label)) return i;
  }
  return 2;
}

function injectNotionFab(host: HTMLElement) {
  if (host.querySelector(".kis-notion-fab")) return;
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "kis-notion-fab";
  fab.setAttribute("data-kis-enhanced", "inject");
  fab.textContent = "New";
  fab.addEventListener("click", () => {
    getActiveScope(host)?.querySelector<HTMLButtonElement>(".page-actions .btn--primary:not([disabled])")?.click();
  });
  host.append(fab);
}

function activeViewMode(shell: HTMLElement): NotionViewMode {
  const active = shell.querySelector<HTMLElement>(".kis-notion-view.is-active");
  return (active?.getAttribute("data-notion-view") ?? "table") as NotionViewMode;
}

export function refreshNotionScope(host: HTMLElement) {
  const scope = getActiveScope(host);
  if (!scope?.classList.contains("kis-notion-scope")) return;
  const kind = getNotionScopeKind(scope);
  scope.setAttribute("data-notion-scope-kind", kind);
  const header = scope.querySelector(".kis-notion-header");
  if (header) {
    header.querySelector(".kis-notion-props")?.remove();
    rebuildNotionHeader(header, kind);
  }
  scope.querySelectorAll("table").forEach((t) => enhanceNotionTable(t as HTMLTableElement));

  const shell = scope.querySelector(".kis-notion-db-shell");
  const panel = getScopeDataPanel(scope);
  const table = panel?.querySelector("table") as HTMLTableElement | null;
  if (shell && panel && table) {
    setNotionViewMode(shell as HTMLElement, panel, table, activeViewMode(shell as HTMLElement));
  }
}
