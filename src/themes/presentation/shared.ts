import { injectAtlasComplianceRibbon, injectAtlasHeaderMetrics, markAtlasTable, wireAtlasSegmentFilter } from "./atlas-layout";
import { enhanceBeaconRowHeat, injectBeaconOpsStrip, layoutBeaconPageHeader } from "./beacon-layout";
import { applyClarityLayout } from "./clarity-layout";
import {
  applyLumenPanelChrome,
  enhanceLumenTables,
  injectLumenGridToolbar,
  layoutLumenPageHeader,
} from "./lumen-layout";
import { applyNotionChrome, refreshNotionScope } from "./notion-layout";
import { cleanupHost, markEnhanced } from "./cleanup";
import { getActiveScope, getScopeDataPanel } from "./scope";
import type { PresentationThemeId } from "./theme-id";

const STATUS_ICON: Record<string, string> = {
  ok: "●",
  warn: "◆",
  err: "✕",
  info: "◎",
  muted: "○",
};

function badgeKind(el: Element): string {
  for (const cls of el.classList) {
    const m = cls.match(/^badge-cell--(ok|warn|err|info|muted|status-.+)$/);
    if (m) {
      if (m[1].startsWith("status-")) return m[1] === "status-active" ? "ok" : m[1] === "status-done" ? "muted" : "info";
      return m[1];
    }
  }
  return "muted";
}

/** 状态徽章 → 带指示点的 pill（不改文案、不挡点击） */
export function enhanceStatusBadges(host: HTMLElement, themeClass: string) {
  host.querySelectorAll(".badge-cell:not([data-kis-enhanced])").forEach((badge) => {
    markEnhanced(badge, "badge");
    badge.classList.add("kis-status-pill", themeClass);
    const kind = badgeKind(badge);
    if (!badge.querySelector(".kis-status-pill__dot")) {
      const dot = document.createElement("span");
      dot.className = `kis-status-pill__dot kis-status-pill__dot--${kind}`;
      dot.setAttribute("aria-hidden", "true");
      badge.prepend(dot);
    }
  });
}

/** 姓名列 → 头像圆标 + 双行（Clarity / Atlas） */
export function enhanceNameCells(host: HTMLElement) {
  host.querySelectorAll(".recruit-subject-table tbody td.pii-mask:not([data-kis-enhanced]), .recruit-subject-table tbody td:nth-child(2):not([data-kis-enhanced])").forEach((cell) => {
    const text = cell.textContent?.trim() ?? "";
    if (!text || cell.querySelector(".kis-identity")) return;
    markEnhanced(cell, "identity");
    const initial = text.replace(/\*/g, "").slice(-1) || text.charAt(0) || "?";
    const wrap = document.createElement("div");
    wrap.className = "kis-identity";
    const avatar = document.createElement("span");
    avatar.className = "kis-identity__avatar";
    avatar.textContent = initial;
    avatar.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "kis-identity__label";
    copy.textContent = text;
    wrap.append(avatar, copy);
    cell.textContent = "";
    cell.append(wrap);
  });
}

/** 页头：摘要条（可见表格行数 / 待处理徽章数） */
export function injectPageHeaderMeta(host: HTMLElement, theme: PresentationThemeId) {
  const visiblePanel = getActiveScope(host);
  const header = visiblePanel?.querySelector(".page-header") ?? host.querySelector(".page-header");
  if (!header || header.querySelector(".kis-page-meta")) return;

  header.classList.add(`kis-page-header--${theme}`);

  const table = visiblePanel?.querySelector("table tbody") ?? host.querySelector("table tbody");
  const rows = table ? table.querySelectorAll("tr:not([hidden])").length : 0;
  const pending = host.querySelectorAll(".badge-cell--warn, .badge-cell--err").length;

  const meta = document.createElement("div");
  meta.className = "kis-page-meta";
  meta.setAttribute("data-kis-enhanced", "inject");
  meta.innerHTML =
    theme === "atlas"
      ? `<span class="kis-page-meta__chip">列表 ${rows} 条</span><span class="kis-page-meta__chip kis-page-meta__chip--alert">需关注 ${pending}</span>`
      : theme === "clarity"
        ? `<span class="kis-page-meta__chip kis-page-meta__chip--accent">本页 ${rows} 条记录</span>${pending ? `<span class="kis-page-meta__chip">待处理 ${pending}</span>` : ""}`
        : theme === "lumen"
          ? `<span class="kis-page-meta__chip kis-page-meta__chip--lumen">网格 ${rows} 行</span><span class="kis-page-meta__chip">悬停交互</span>${pending ? `<span class="kis-page-meta__chip kis-page-meta__chip--alert">待办 ${pending}</span>` : ""}`
          : `<span class="kis-page-meta__chip">现场队列 ${rows}</span><span class="kis-page-meta__chip kis-page-meta__chip--live">实时</span>`;

  const titleBlock = header.querySelector("div:first-child") ?? header.querySelector("h1")?.parentElement;
  if (titleBlock) titleBlock.append(meta);
  else header.prepend(meta);
}

const BTN_GLYPH: Record<PresentationThemeId, string> = {
  beacon: "▸",
  clarity: "+",
  atlas: "→",
  lumen: "⬡",
  notion: "✦",
};

/** 主按钮图标（仅视觉） */
export function enhancePrimaryButtons(host: HTMLElement, theme: PresentationThemeId) {
  host.querySelectorAll(".btn--primary:not([data-kis-enhanced])").forEach((btn) => {
    markEnhanced(btn, "btn");
    if (btn.querySelector(".kis-btn-glyph")) return;
    const glyph = document.createElement("span");
    glyph.className = "kis-btn-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = BTN_GLYPH[theme];
    btn.prepend(glyph);
  });
}

/** Atlas：面板顶部分段条（由当前表格状态统计） */
export function injectAtlasSegmentBar(host: HTMLElement) {
  const scope = getActiveScope(host);
  const panel = getScopeDataPanel(scope);
  if (!panel || panel.querySelector(".kis-segment-bar")) return;

  const warn = panel.querySelectorAll(".badge-cell--warn").length;
  const err = panel.querySelectorAll(".badge-cell--err").length;
  const ok = panel.querySelectorAll(".badge-cell--ok").length;

  const bar = document.createElement("div");
  bar.className = "kis-segment-bar";
  bar.setAttribute("data-kis-enhanced", "inject");
  bar.innerHTML = `
    <button type="button" class="kis-segment-bar__item is-active" tabindex="-1">全部</button>
    <button type="button" class="kis-segment-bar__item" tabindex="-1">正常 ${ok}</button>
    <button type="button" class="kis-segment-bar__item kis-segment-bar__item--warn" tabindex="-1">待办 ${warn}</button>
    <button type="button" class="kis-segment-bar__item kis-segment-bar__item--err" tabindex="-1">异常 ${err}</button>
  `;
  panel.insertBefore(bar, panel.firstChild);
  panel.classList.add("kis-data-panel--deck");
  if (scope) wireAtlasSegmentFilter(bar, scope);
}

/** Atlas：合规式状态徽章 */
export function enhanceAtlasBadges(host: HTMLElement) {
  host.querySelectorAll(".badge-cell:not([data-kis-atlas])").forEach((badge) => {
    badge.setAttribute("data-kis-atlas", "1");
    badge.classList.add("kis-compliance-badge");
    const kind = badgeKind(badge);
    const icon = STATUS_ICON[kind] ?? "○";
    if (!badge.querySelector(".kis-compliance-badge__icon")) {
      const i = document.createElement("span");
      i.className = "kis-compliance-badge__icon";
      i.textContent = icon;
      badge.prepend(i);
    }
  });
}

export function refreshVisible(host: HTMLElement, theme: PresentationThemeId) {
  cleanupHost(host);
  const scope = getActiveScope(host);

  if (theme !== "notion") injectPageHeaderMeta(host, theme);
  if (theme !== "notion") enhancePrimaryButtons(host, theme);
  if (theme !== "lumen" && theme !== "notion") enhanceStatusBadges(host, `kis-status-pill--${theme}`);

  if (theme === "beacon") {
    layoutBeaconPageHeader(scope);
    injectBeaconOpsStrip(host);
    enhanceBeaconRowHeat(scope);
  }

  if (theme === "clarity") {
    applyClarityLayout(host);
    host.querySelectorAll(".badge-cell.kis-status-pill--clarity").forEach((b) => b.classList.add("kis-clarity-pill"));
  }

  if (theme === "clarity" || theme === "atlas") enhanceNameCells(host);

  if (theme === "atlas") {
    injectAtlasComplianceRibbon(host);
    injectAtlasHeaderMetrics(host);
    injectAtlasSegmentBar(host);
    enhanceAtlasBadges(host);
    markAtlasTable(scope);
  }

  if (theme === "lumen") {
    layoutLumenPageHeader(scope);
    applyLumenPanelChrome(host);
    injectLumenGridToolbar(host);
    enhanceLumenTables(scope);
  }

  if (theme === "notion") {
    if (!scope?.querySelector(".kis-notion-hero")) applyNotionChrome(host);
    else refreshNotionScope(host);
  }

  if (theme !== "notion") {
    host.querySelectorAll(".data-panel .data-panel__toolbar").forEach((toolbar) => {
      toolbar.classList.add("kis-toolbar-deck");
    });
  }
}

export function createPresentationObserver(host: HTMLElement, theme: PresentationThemeId) {
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => refreshVisible(host, theme), 80);
  };
  schedule();
  const mo = new MutationObserver(schedule);
  mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });

  const onNav = () => schedule();
  window.addEventListener("kis-theme-change", onNav);
  document.addEventListener("kis-phase-change", onNav);

  return () => {
    mo.disconnect();
    window.removeEventListener("kis-theme-change", onNav);
    document.removeEventListener("kis-phase-change", onNav);
    window.clearTimeout(timer);
    cleanupHost(host);
  };
}
