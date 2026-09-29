/** Notion 主题：Board / Gallery 视图（由表格行驱动，拖拽会改状态徽章） */

export type NotionRowStatus = "ok" | "warn" | "err" | "info" | "muted";

export interface NotionRowModel {
  tr: HTMLTableRowElement;
  title: string;
  subtitle: string;
  status: NotionRowStatus;
  statusLabel: string;
}

const COLUMN_DEF: Array<{ id: NotionRowStatus; label: string; hint: string }> = [
  { id: "warn", label: "待处理", hint: "需跟进" },
  { id: "ok", label: "正常", hint: "已就绪" },
  { id: "err", label: "异常", hint: "需升级" },
  { id: "muted", label: "其它", hint: "未分类" },
  { id: "info", label: "进行中", hint: "处理中" },
];

const STATUS_CLASS: Record<NotionRowStatus, string> = {
  ok: "badge-cell--ok",
  warn: "badge-cell--warn",
  err: "badge-cell--err",
  info: "badge-cell--info",
  muted: "badge-cell--muted",
};

const DEFAULT_LABEL: Record<NotionRowStatus, string> = {
  ok: "正常",
  warn: "待处理",
  err: "异常",
  info: "进行中",
  muted: "其它",
};

function rowStatus(tr: HTMLTableRowElement): { status: NotionRowStatus; label: string } {
  const badge = tr.querySelector(".badge-cell");
  if (!badge) return { status: "muted", label: "其它" };
  for (const s of ["ok", "warn", "err", "info", "muted"] as const) {
    if (badge.classList.contains(`badge-cell--${s}`)) {
      return { status: s, label: badge.textContent?.trim() || DEFAULT_LABEL[s] };
    }
  }
  return { status: "muted", label: badge.textContent?.trim() || "其它" };
}

function findTitleCell(tr: HTMLTableRowElement): HTMLTableCellElement | null {
  const marked = tr.querySelector("td.kis-notion-cell-title");
  if (marked) return marked as HTMLTableCellElement;
  const pii = tr.querySelector("td.pii-mask");
  if (pii) return pii as HTMLTableCellElement;
  return tr.querySelector("td:nth-child(2), td:nth-child(3)") as HTMLTableCellElement | null;
}

function cellText(cell: HTMLTableCellElement | null): string {
  if (!cell) return "";
  return cell.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function parseTableRows(table: HTMLTableElement): NotionRowModel[] {
  const rows: NotionRowModel[] = [];
  table.querySelectorAll("tbody tr").forEach((tr) => {
    if (tr.hidden) return;
    const titleCell = findTitleCell(tr as HTMLTableRowElement);
    const title = cellText(titleCell);
    const cells = [...tr.querySelectorAll("td")].map((td) => cellText(td as HTMLTableCellElement)).filter(Boolean);
    const subtitle = cells.filter((t) => t !== title).slice(0, 2).join(" · ");
    const { status, label } = rowStatus(tr as HTMLTableRowElement);
    rows.push({ tr: tr as HTMLTableRowElement, title: title || "Untitled", subtitle, status, statusLabel: label });
  });
  return rows;
}

function setRowStatus(tr: HTMLTableRowElement, status: NotionRowStatus) {
  let badge = tr.querySelector(".badge-cell");
  if (!badge) {
    const td = document.createElement("td");
    badge = document.createElement("span");
    td.append(badge);
    tr.insertBefore(td, tr.querySelector(".col-sticky-op") ?? null);
  }
  badge.className = `badge-cell ${STATUS_CLASS[status]} kis-notion-tag ${tagClass(status)}`;
  badge.setAttribute("data-kis-notion-tag", "1");
  badge.textContent = DEFAULT_LABEL[status];
}

function cardHtml(row: NotionRowModel) {
  const id = row.tr.getAttribute("data-kis-notion-row-id") ?? "";
  return `
    <article class="kis-notion-kanban-card" draggable="true" data-kis-notion-row-id="${id}" tabindex="0">
      <div class="kis-notion-kanban-card__title">${escapeHtml(row.title)}</div>
      ${row.subtitle ? `<div class="kis-notion-kanban-card__meta">${escapeHtml(row.subtitle)}</div>` : ""}
      <span class="kis-notion-tag ${tagClass(row.status)}">${escapeHtml(row.statusLabel)}</span>
    </article>
  `;
}

function galleryCardHtml(row: NotionRowModel) {
  const id = row.tr.getAttribute("data-kis-notion-row-id") ?? "";
  const initial = row.title.replace(/\*/g, "").slice(-1) || "?";
  return `
    <article class="kis-notion-gallery-card" data-kis-notion-row-id="${id}" tabindex="0">
      <div class="kis-notion-gallery-card__cover">${escapeHtml(initial)}</div>
      <div class="kis-notion-gallery-card__body">
        <div class="kis-notion-gallery-card__title">${escapeHtml(row.title)}</div>
        ${row.subtitle ? `<div class="kis-notion-gallery-card__meta">${escapeHtml(row.subtitle)}</div>` : ""}
        <span class="kis-notion-tag ${tagClass(row.status)}">${escapeHtml(row.statusLabel)}</span>
      </div>
    </article>
  `;
}

function tagClass(status: NotionRowStatus) {
  const map: Record<NotionRowStatus, string> = {
    ok: "kis-notion-tag--green",
    warn: "kis-notion-tag--yellow",
    err: "kis-notion-tag--red",
    info: "kis-notion-tag--blue",
    muted: "kis-notion-tag--gray",
  };
  return map[status];
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ensureRowIds(table: HTMLTableElement) {
  table.querySelectorAll("tbody tr").forEach((tr, i) => {
    if (!tr.getAttribute("data-kis-notion-row-id")) tr.setAttribute("data-kis-notion-row-id", `nrow-${i}-${Date.now().toString(36)}`);
  });
}

function findRowById(table: HTMLTableElement, id: string) {
  return table.querySelector<HTMLTableRowElement>(`tbody tr[data-kis-notion-row-id="${id}"]`);
}

export function renderNotionBoard(board: HTMLElement, table: HTMLTableElement) {
  ensureRowIds(table);
  const rows = parseTableRows(table);
  board.innerHTML = "";
  board.classList.add("kis-notion-kanban");
  board.removeAttribute("hidden");

  const cols = COLUMN_DEF.filter((col) => col.id === "warn" || col.id === "ok" || col.id === "err" || col.id === "info");

  for (const col of cols) {
    const colEl = document.createElement("div");
    colEl.className = "kis-notion-kanban-col";
    colEl.dataset.col = col.id;
    const items = rows.filter((r) => r.status === col.id);
    colEl.innerHTML = `
      <header class="kis-notion-kanban-col__head">
        <span>${col.label}</span>
        <span class="kis-notion-kanban-col__count">${items.length}</span>
      </header>
      <div class="kis-notion-kanban-col__body"></div>
    `;
    const body = colEl.querySelector(".kis-notion-kanban-col__body")!;
    for (const row of items) {
      body.insertAdjacentHTML("beforeend", cardHtml(row));
    }
    board.append(colEl);
  }

  wireKanbanDnD(board, table);
  wireCardOpen(board, table);
}

export function renderNotionGallery(gallery: HTMLElement, table: HTMLTableElement) {
  ensureRowIds(table);
  const rows = parseTableRows(table);
  gallery.innerHTML = "";
  gallery.className = "kis-notion-gallery";
  gallery.removeAttribute("hidden");
  for (const row of rows) {
    gallery.insertAdjacentHTML("beforeend", galleryCardHtml(row));
  }
  wireCardOpen(gallery, table);
}

function wireCardOpen(root: HTMLElement, table: HTMLTableElement) {
  root.querySelectorAll("[data-kis-notion-row-id]").forEach((card) => {
    card.addEventListener("dblclick", () => {
      const id = card.getAttribute("data-kis-notion-row-id");
      const tr = id ? findRowById(table, id) : null;
      tr?.querySelector<HTMLElement>(".table-row-actions__link, button[data-action]")?.click();
    });
  });
}

function wireKanbanDnD(board: HTMLElement, table: HTMLTableElement) {
  let dragId: string | null = null;

  board.querySelectorAll(".kis-notion-kanban-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      dragId = card.getAttribute("data-kis-notion-row-id");
      card.classList.add("is-dragging");
      e.dataTransfer?.setData("text/plain", dragId ?? "");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      dragId = null;
      board.querySelectorAll(".kis-notion-kanban-col").forEach((c) => c.classList.remove("is-drop-target"));
    });
  });

  board.querySelectorAll(".kis-notion-kanban-col").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("is-drop-target");
    });
    col.addEventListener("dragleave", () => col.classList.remove("is-drop-target"));
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("is-drop-target");
      const id = dragId || e.dataTransfer?.getData("text/plain");
      const status = col.getAttribute("data-col") as NotionRowStatus | null;
      if (!id || !status) return;
      const tr = findRowById(table, id);
      if (!tr) return;
      setRowStatus(tr, status);
      renderNotionBoard(board, table);
    });
  });
}

export type NotionViewMode = "table" | "board" | "gallery";

export function setNotionViewMode(shell: HTMLElement, panel: HTMLElement, table: HTMLTableElement | null, mode: NotionViewMode) {
  const tableWrap = panel.querySelector<HTMLElement>("[class*='-table-scroll'], .plan-table-scroll, .recruit-subject-table-scroll");
  let board = shell.querySelector<HTMLElement>(".kis-notion-board");
  let gallery = shell.querySelector<HTMLElement>(".kis-notion-gallery");

  if (!board) {
    board = document.createElement("div");
    board.className = "kis-notion-board";
    board.setAttribute("data-kis-enhanced", "inject");
    shell.append(board);
  }
  if (!gallery) {
    gallery = document.createElement("div");
    gallery.className = "kis-notion-gallery";
    gallery.hidden = true;
    gallery.setAttribute("data-kis-enhanced", "inject");
    shell.append(gallery);
  }

  const isTable = mode === "table";
  const isBoard = mode === "board";
  const isGallery = mode === "gallery";

  if (tableWrap) tableWrap.hidden = !isTable;
  panel.querySelector(".data-panel__toolbar")?.classList.toggle("is-hidden", !isTable);
  panel.querySelector(".data-panel__quick-bar")?.classList.toggle("is-hidden", !isTable);

  board.hidden = !isBoard;
  gallery.hidden = !isGallery;

  if (table && isBoard) renderNotionBoard(board, table);
  if (table && isGallery) renderNotionGallery(gallery, table);
}
