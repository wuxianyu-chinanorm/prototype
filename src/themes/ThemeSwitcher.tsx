import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { applyKisTheme } from "./engine";
import { KIS_THEMES, readKisTheme, type KisThemeId } from "./registry";

export function ThemeSwitcher() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<KisThemeId>("classic");

  useEffect(() => {
    setSlot(document.getElementById("kis-theme-switch"));
    setCurrent(readKisTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const root = document.getElementById("kis-theme-switch");
      if (root && event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!slot) return null;

  const active = KIS_THEMES.find((theme) => theme.id === current) ?? KIS_THEMES[0];

  return createPortal(
    <>
      <button
        type="button"
        className="theme-switch__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="kis-theme-menu"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span className="theme-switch__kicker">风格</span>
        <span className="theme-switch__name">{active.label}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="theme-switch__menu" id="kis-theme-menu" role="menu" hidden={!open}>
        {KIS_THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            role="menuitemradio"
            aria-checked={theme.id === current}
            className={theme.id === current ? "theme-switch__item is-current" : "theme-switch__item"}
            onClick={(event) => {
              event.stopPropagation();
              setCurrent(applyKisTheme(theme.id));
              setOpen(false);
            }}
          >
            <span className="theme-switch__item-label">
              {theme.label}
              <span className="theme-switch__english">{theme.english}</span>
            </span>
            <span className="theme-switch__hint">{theme.hint}</span>
          </button>
        ))}
      </div>
    </>,
    slot,
  );
}
