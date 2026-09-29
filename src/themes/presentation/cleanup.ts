const ENHANCED = "data-kis-enhanced";

let activeFieldTip: HTMLDivElement | null = null;

export function hideFieldTip() {
  activeFieldTip?.remove();
  activeFieldTip = null;
}

export function showFieldTip(anchor: Element, text: string) {
  hideFieldTip();
  activeFieldTip = document.createElement("div");
  activeFieldTip.className = "kis-lumen-field-tip";
  activeFieldTip.setAttribute("role", "tooltip");
  activeFieldTip.textContent = text;
  document.body.append(activeFieldTip);
  const r = anchor.getBoundingClientRect();
  activeFieldTip.style.left = `${r.left + r.width / 2}px`;
  activeFieldTip.style.top = `${r.top - 6}px`;
}

export function markEnhanced(el: Element, kind: string) {
  el.setAttribute(ENHANCED, kind);
}

export function cleanupHost(host: HTMLElement) {
  hideFieldTip();
  host.querySelectorAll("table[data-kis-lumen-wired]").forEach((table) => {
    table.removeAttribute("data-kis-lumen-wired");
  });

  host.querySelectorAll(`[${ENHANCED}="inject"]`).forEach((node) => node.remove());
  host.querySelectorAll(`td[${ENHANCED}="identity"]`).forEach((cell) => {
    const label = cell.querySelector(".kis-identity__label")?.textContent;
    cell.textContent = label ?? cell.textContent;
    cell.removeAttribute(ENHANCED);
  });

  host.querySelectorAll(`.badge-cell[${ENHANCED}]`).forEach((badge) => {
    badge.querySelector(".kis-status-pill__dot")?.remove();
    badge.querySelector(".kis-compliance-badge__icon")?.remove();
    badge.classList.remove("kis-status-pill", "kis-compliance-badge", "kis-status-pill--beacon", "kis-status-pill--clarity", "kis-status-pill--atlas");
    badge.removeAttribute(ENHANCED);
    badge.removeAttribute("data-kis-atlas");
  });

  host.querySelectorAll(`.btn--primary[${ENHANCED}]`).forEach((btn) => {
    btn.querySelector(".kis-btn-glyph")?.remove();
    btn.removeAttribute(ENHANCED);
  });

  host.querySelectorAll(".kis-page-header--clarity, .kis-page-header--beacon, .kis-page-header--atlas").forEach((el) => {
    el.classList.remove(
      "kis-page-header--clarity",
      "kis-page-header--beacon",
      "kis-page-header--atlas",
      "kis-page-header--atlas-split",
    );
  });
  host.querySelectorAll(".kis-data-panel--deck").forEach((el) => el.classList.remove("kis-data-panel--deck"));
  host.querySelectorAll(".kis-toolbar-deck").forEach((el) => el.classList.remove("kis-toolbar-deck"));
  host.querySelectorAll(".kis-clarity-panel").forEach((el) => el.classList.remove("kis-clarity-panel"));
  host.querySelectorAll(".kis-page-actions--beacon, .kis-page-actions--clarity").forEach((el) => {
    el.classList.remove("kis-page-actions--beacon", "kis-page-actions--clarity");
  });
  host.querySelectorAll(".kis-row--heat-warn, .kis-row--heat-err").forEach((row) => {
    row.classList.remove("kis-row--heat-warn", "kis-row--heat-err");
  });
  host.querySelectorAll(".kis-atlas-table").forEach((el) => el.classList.remove("kis-atlas-table"));
  host.querySelectorAll("table tbody tr[hidden]").forEach((row) => {
    (row as HTMLElement).hidden = false;
  });
  host.querySelectorAll(".kis-clarity-pill").forEach((el) => el.classList.remove("kis-clarity-pill"));

  host.querySelectorAll(`th[${ENHANCED}="th"]`).forEach((th) => {
    const label = th.getAttribute("data-kis-label");
    if (label) th.textContent = label;
    th.removeAttribute("data-kis-label");
    th.removeAttribute(ENHANCED);
    th.classList.remove("kis-lumen-th");
  });

  host.querySelectorAll(`td[${ENHANCED}="link"]`).forEach((cell) => {
    const text = cell.querySelector(".kis-lumen-link-cell__text")?.textContent?.replace("↗", "").trim();
    cell.textContent = text ?? cell.textContent;
    cell.removeAttribute(ENHANCED);
  });

  host.querySelectorAll(`td[${ENHANCED}="locked"]`).forEach((cell) => {
    cell.classList.remove("kis-lumen-locked-cell");
    cell.removeAttribute("title");
    cell.removeAttribute(ENHANCED);
  });

  host.querySelectorAll(`td[${ENHANCED}="editable"], td[${ENHANCED}="edit-mono"]`).forEach((cell) => {
    cell.querySelector(".kis-lumen-inline-input")?.remove();
    cell.querySelector(".kis-lumen-hover-btn--edit")?.remove();
    cell.classList.remove(
      "kis-lumen-editable-cell",
      "kis-lumen-edit-mono",
      "kis-lumen-cell--editing",
      "kis-lumen-cell--error",
    );
    cell.removeAttribute(ENHANCED);
  });

  host.querySelectorAll("[data-kis-lumen-score]").forEach((badge) => {
    badge.querySelector(".kis-lumen-bool")?.remove();
    badge.classList.remove(
      "kis-lumen-score",
      "kis-lumen-score--high",
      "kis-lumen-score--medium",
      "kis-lumen-score--low",
      "kis-lumen-score--neutral",
    );
    badge.removeAttribute("data-kis-lumen-score");
  });

  host.querySelectorAll(".kis-lumen-shell").forEach((el) => el.classList.remove("kis-lumen-shell"));
  host.querySelectorAll(".kis-lumen-grid-wrap").forEach((el) => el.classList.remove("kis-lumen-grid-wrap"));
  host.querySelectorAll(".kis-lumen-table").forEach((el) => el.classList.remove("kis-lumen-table"));
  host.querySelectorAll(".kis-lumen-tr").forEach((el) => el.classList.remove("kis-lumen-tr"));
  host.querySelectorAll(".kis-page-header--lumen").forEach((el) => el.classList.remove("kis-page-header--lumen"));
  host.querySelectorAll(".kis-lumen-table--compact").forEach((el) => el.classList.remove("kis-lumen-table--compact"));
  host.querySelectorAll(".kis-lumen-status-cell").forEach((el) => el.classList.remove("kis-lumen-status-cell"));
  host.querySelectorAll("th.kis-lumen-th").forEach((th) => {
    th.classList.remove("is-sorted-asc", "is-sorted-desc", "kis-lumen-th--rail");
  });

  host.querySelectorAll(`th[${ENHANCED}="notion-col"], td[${ENHANCED}="notion-col"]`).forEach((cell) => cell.remove());

  host.querySelectorAll("[data-kis-notion-tag]").forEach((badge) => {
    badge.classList.remove(
      "kis-notion-tag",
      "kis-notion-tag--green",
      "kis-notion-tag--yellow",
      "kis-notion-tag--red",
      "kis-notion-tag--blue",
      "kis-notion-tag--gray",
    );
    badge.removeAttribute("data-kis-notion-tag");
  });

  host.querySelectorAll(`td[${ENHANCED}="notion-title"], th[${ENHANCED}="notion-title"]`).forEach((cell) => {
    cell.classList.remove("kis-notion-cell-title");
    cell.removeAttribute(ENHANCED);
  });

  host.querySelectorAll(".kis-notion-table").forEach((el) => el.classList.remove("kis-notion-table"));
  host.querySelectorAll(".kis-notion-database").forEach((el) => {
    el.classList.remove("kis-notion-database");
    el.querySelector(".data-panel__toolbar")?.classList.remove("kis-notion-db-toolbar", "is-hidden");
    el.querySelector(".data-panel__quick-bar")?.classList.remove("kis-notion-db-quick", "is-hidden");
  });

  host.querySelectorAll(".kis-notion-header").forEach((header) => {
    header.classList.remove("kis-notion-header");
    header.querySelector(".kis-notion-title")?.classList.remove("kis-notion-title");
    header.querySelector(".kis-notion-subtitle")?.classList.remove("kis-notion-subtitle");
    header.querySelector(".kis-notion-actions")?.classList.remove("kis-notion-actions");
  });

  host.querySelectorAll(".kis-notion-scope").forEach((el) => {
    el.classList.remove("kis-notion-scope");
    el.removeAttribute("data-notion-scope-kind");
  });

  host.querySelectorAll('[data-kis-enhanced="notion-wrap"]').forEach((shell) => {
    const panel = shell.querySelector(".data-panel");
    const parent = shell.parentElement;
    if (panel && parent) parent.insertBefore(panel, shell);
    shell.remove();
  });

  host.querySelectorAll('[data-kis-enhanced="notion-shell"]').forEach((doc) => {
    const scope = doc.parentElement;
    if (!scope) {
      doc.remove();
      return;
    }
    while (doc.firstChild) {
      scope.insertBefore(doc.firstChild, doc);
    }
    doc.remove();
  });

  host.querySelectorAll('[data-kis-enhanced="notion-hero"]').forEach((hero) => {
    const scope = hero.parentElement;
    const header = hero.querySelector(".page-header");
    if (scope && header) {
      const doc = scope.querySelector('[data-kis-enhanced="notion-shell"]');
      scope.insertBefore(header, doc ?? hero.nextSibling);
    }
    hero.remove();
  });

  host.querySelectorAll("tbody tr[data-kis-notion-row-id]").forEach((tr) => {
    tr.removeAttribute("data-kis-notion-row-id");
  });
}
