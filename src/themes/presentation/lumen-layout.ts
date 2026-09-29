import { hideFieldTip, markEnhanced, showFieldTip } from "./cleanup";
import { getActiveScope, getScopeDataPanel } from "./scope";

const TH_ICON_RULES: Array<[RegExp, string]> = [
  [/编号|ID|研究|SC|计划/i, "⎇"],
  [/姓名|名称|标题|项目/i, "◉"],
  [/手机|电话/i, "☎"],
  [/预约|到访|日期|时间/i, "◷"],
  [/状态|进度|登记/i, "◈"],
  [/操作/i, "⋯"],
  [/率|数|量/i, "▦"],
];

const TIP_TEXT = "不可编辑字段。";

function thIcon(label: string) {
  for (const [re, icon] of TH_ICON_RULES) {
    if (re.test(label)) return icon;
  }
  return "◫";
}

function isStudyId(text: string) {
  return /^[A-Z]\d{4,}/.test(text) || /^C\d+/.test(text) || /^H\d+/.test(text) || /^SC-/.test(text);
}

function isMaskedPhone(text: string) {
  return /\*{2,}/.test(text) || (/\d{3}/.test(text) && text.includes("*"));
}

function badgeScoreClass(el: Element): "high" | "medium" | "low" | "neutral" {
  if (el.classList.contains("badge-cell--ok")) return "high";
  if (el.classList.contains("badge-cell--warn")) return "medium";
  if (el.classList.contains("badge-cell--err")) return "low";
  return "neutral";
}

export function applyLumenPanelChrome(host: HTMLElement) {
  const scope = getActiveScope(host);
  const panel = getScopeDataPanel(scope);
  if (!panel || panel.classList.contains("kis-lumen-shell")) return;
  panel.classList.add("kis-lumen-shell");

  const scroll =
    panel.querySelector(".recruit-subject-table-scroll, .plan-table-scroll, .study-chain-table-scroll") ??
    panel.querySelector("[class*='-table-scroll']");
  scroll?.classList.add("kis-lumen-grid-wrap");
}

export function injectLumenGridToolbar(host: HTMLElement) {
  const scope = getActiveScope(host);
  const panel = getScopeDataPanel(scope);
  if (!panel || panel.querySelector(".kis-lumen-grid-toolbar")) return;

  const table = scope?.querySelector("table.kis-lumen-table, table");
  const cols = table?.querySelectorAll("thead th").length ?? 0;
  const rows = table?.querySelectorAll("tbody tr:not([hidden])").length ?? 0;

  const bar = document.createElement("div");
  bar.className = "kis-lumen-grid-toolbar";
  bar.setAttribute("data-kis-enhanced", "inject");
  bar.innerHTML = `
    <div class="kis-lumen-grid-toolbar__left">
      <button type="button" class="kis-lumen-grid-toolbar__pill is-active" tabindex="-1">表格</button>
      <button type="button" class="kis-lumen-grid-toolbar__pill" tabindex="-1">紧凑</button>
      <button type="button" class="kis-lumen-grid-toolbar__pill" tabindex="-1">列设置</button>
    </div>
    <div class="kis-lumen-grid-toolbar__meta">${cols} 列 · ${rows} 行 · 双击单元格可编辑</div>
  `;
  bar.querySelectorAll(".kis-lumen-grid-toolbar__pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      bar.querySelectorAll(".kis-lumen-grid-toolbar__pill").forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");
      const compact = pill.textContent?.includes("紧凑");
      table?.classList.toggle("kis-lumen-table--compact", !!compact);
    });
  });

  const wrap = panel.querySelector(".kis-lumen-grid-wrap") ?? panel.querySelector("[class*='-table-scroll']");
  if (wrap) wrap.before(bar);
  else panel.prepend(bar);
}

export function enhanceLumenTables(scope: HTMLElement | null) {
  if (!scope) return;
  scope
    .querySelectorAll("table.plan-table, table.recruit-subject-table, table.study-chain-table, table.data-table")
    .forEach((table) => {
      table.classList.add("kis-lumen-table");
      enhanceLumenHead(table as HTMLTableElement);
      enhanceLumenBody(table as HTMLTableElement);
      wireLumenTable(table as HTMLTableElement);
    });
}

function enhanceLumenHead(table: HTMLTableElement) {
  table.querySelectorAll("thead th").forEach((th) => {
    if (th.getAttribute("data-kis-enhanced") === "th") return;
    const label = th.textContent?.trim() ?? "";
    if (!label) return;
    markEnhanced(th, "th");
    th.setAttribute("data-kis-label", label);
    th.classList.add("kis-lumen-th");
    if (/状态|登记|进度|Score/i.test(label)) th.classList.add("kis-lumen-th--rail");
    th.innerHTML = `
      <span class="kis-lumen-th__icon" aria-hidden="true">${thIcon(label)}</span>
      <span class="kis-lumen-th__label">${label}</span>
      <span class="kis-lumen-th__sort" aria-hidden="true">↕</span>
      <span class="kis-lumen-th__resize" aria-hidden="true"></span>
    `;
  });
}

function wireLumenTable(table: HTMLTableElement) {
  if (table.dataset.kisLumenWired === "1") return;
  table.dataset.kisLumenWired = "1";

  table.addEventListener("click", (e) => {
    const th = (e.target as Element).closest("th.kis-lumen-th");
    if (!th || !table.contains(th)) return;
    const sorted = th.classList.contains("is-sorted-asc");
    table.querySelectorAll("th.kis-lumen-th").forEach((h) => h.classList.remove("is-sorted-asc", "is-sorted-desc"));
    th.classList.add(sorted ? "is-sorted-desc" : "is-sorted-asc");
    const sortEl = th.querySelector(".kis-lumen-th__sort");
    if (sortEl) sortEl.textContent = sorted ? "↓" : "↑";
  });

  table.addEventListener("mouseover", (e) => {
    const locked = (e.target as Element).closest(".kis-lumen-locked-cell");
    if (locked && table.contains(locked)) showFieldTip(locked, TIP_TEXT);
    else if (!(e.target as Element).closest(".kis-lumen-locked-cell")) hideFieldTip();

    const tr = (e.target as Element).closest("tr.kis-lumen-tr");
    if (tr && table.contains(tr)) {
      table.querySelectorAll("tr.kis-lumen-tr").forEach((r) => r.classList.remove("is-row-active"));
      tr.classList.add("is-row-active");
    }
  });

  table.addEventListener("mouseleave", () => {
    hideFieldTip();
    table.querySelectorAll("tr.kis-lumen-tr").forEach((r) => r.classList.remove("is-row-active"));
  });

  table.addEventListener("dblclick", (e) => {
    const td = (e.target as Element).closest("td.kis-lumen-editable-cell, td.kis-lumen-edit-mono");
    if (!td || !table.contains(td)) return;
    const btn = td.querySelector<HTMLButtonElement>(".kis-lumen-hover-btn--edit");
    btn?.click();
  });
}

function enhanceLumenBody(table: HTMLTableElement) {
  table.querySelectorAll("tbody tr").forEach((tr) => {
    tr.classList.add("kis-lumen-tr");

    tr.querySelectorAll("td.cell-mono").forEach((td) => {
      const text = td.textContent?.trim() ?? "";
      if (isMaskedPhone(text) && !isStudyId(text)) {
        attachEditMono(td as HTMLTableCellElement);
        return;
      }
      if (td.getAttribute("data-kis-enhanced")) return;
      markEnhanced(td, "locked");
      td.classList.add("kis-lumen-locked-cell");
    });

    tr.querySelectorAll("td.pii-mask, td.col-study-name, td.td-study-name").forEach((td) => {
      if (td.getAttribute("data-kis-enhanced") === "link") return;
      const text = td.textContent?.trim() ?? "";
      if (!text || td.querySelector(".kis-lumen-link-cell")) return;
      markEnhanced(td, "link");
      const wrap = document.createElement("div");
      wrap.className = "kis-lumen-link-cell";
      wrap.innerHTML = `
        <span class="kis-lumen-link-cell__text">${text}<span class="kis-lumen-link-cell__ext" aria-hidden="true">↗</span></span>
        <button type="button" class="kis-lumen-hover-btn kis-lumen-hover-btn--ghost">打开</button>
      `;
      wrap.querySelector("button")?.addEventListener("click", (e) => {
        e.stopPropagation();
        tr.querySelector<HTMLElement>(".table-row-actions__link, button[data-action]")?.click();
      });
      td.textContent = "";
      td.append(wrap);
    });

    tr.querySelectorAll("td").forEach((td) => {
      if (td.classList.contains("col-sticky-op") || td.querySelector(".badge-cell")) return;
      if (td.classList.contains("cell-mono") || td.classList.contains("pii-mask")) return;
      if (td.getAttribute("data-kis-enhanced")) return;
      if (td.childElementCount > 0) return;
      const text = td.textContent?.trim() ?? "";
      if (!text || text.length > 48) return;
      attachEditable(td as HTMLTableCellElement);
    });

    tr.querySelectorAll(".badge-cell").forEach((badge) => {
      if (badge.getAttribute("data-kis-lumen-score")) return;
      badge.setAttribute("data-kis-lumen-score", "1");
      const tier = badgeScoreClass(badge);
      badge.classList.add("kis-lumen-score", `kis-lumen-score--${tier}`);

      const td = badge.closest("td");
      td?.classList.add("kis-lumen-status-cell");

      if (tier === "high" || tier === "neutral") {
        prependBool(badge, "yes");
      } else if (tier === "low") {
        prependBool(badge, "no");
      }
    });

  });
}

function prependBool(badge: Element, kind: "yes" | "no") {
  if (badge.querySelector(".kis-lumen-bool")) return;
  const b = document.createElement("span");
  b.className = `kis-lumen-bool kis-lumen-bool--${kind}`;
  b.setAttribute("aria-hidden", "true");
  b.textContent = kind === "yes" ? "✓" : "✕";
  badge.prepend(b);
}

function attachEditable(td: HTMLTableCellElement) {
  markEnhanced(td, "editable");
  td.classList.add("kis-lumen-editable-cell");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "kis-lumen-hover-btn kis-lumen-hover-btn--edit kis-lumen-hover-btn--ghost";
  btn.textContent = "编辑";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    startInlineEdit(td, btn);
  });
  td.append(btn);
}

function attachEditMono(td: HTMLTableCellElement) {
  markEnhanced(td, "edit-mono");
  td.classList.add("kis-lumen-editable-cell", "kis-lumen-edit-mono");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "kis-lumen-hover-btn kis-lumen-hover-btn--edit kis-lumen-hover-btn--ghost";
  btn.textContent = "编辑";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    startInlineEdit(td, btn);
  });
  td.append(btn);
}

function startInlineEdit(td: HTMLTableCellElement, btn: HTMLButtonElement) {
  if (td.classList.contains("kis-lumen-cell--editing")) return;
  const original =
    td.childNodes[0]?.nodeType === Node.TEXT_NODE
      ? (td.childNodes[0].textContent?.trim() ?? "")
      : (td.textContent?.replace("编辑", "").trim() ?? "");
  td.classList.add("kis-lumen-cell--editing");
  btn.hidden = true;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "kis-lumen-inline-input";
  input.value = original;
  td.textContent = "";
  td.append(input);
  input.focus();
  input.select();

  const finish = (valid: boolean) => {
    td.classList.remove("kis-lumen-cell--editing");
    td.classList.toggle("kis-lumen-cell--error", !valid);
    td.textContent = input.value || original;
    btn.hidden = false;
    td.append(btn);
    if (!valid) window.setTimeout(() => td.classList.remove("kis-lumen-cell--error"), 1400);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(!/^\d{10,}$/.test(input.value));
    if (e.key === "Escape") {
      input.value = original;
      finish(true);
    }
  });
  input.addEventListener("blur", () => finish(!/^\d{10,}$/.test(input.value)));
}

export function layoutLumenPageHeader(scope: HTMLElement | null) {
  const header = scope?.querySelector(".page-header");
  if (!header) return;
  header.classList.add("kis-page-header--lumen");
  if (header.querySelector(".kis-lumen-crumb")) return;
  const crumb = document.createElement("div");
  crumb.className = "kis-lumen-crumb";
  crumb.setAttribute("data-kis-enhanced", "inject");
  crumb.innerHTML = `<span>Records</span><span aria-hidden="true">/</span><span>Interactive grid</span>`;
  header.prepend(crumb);
}
