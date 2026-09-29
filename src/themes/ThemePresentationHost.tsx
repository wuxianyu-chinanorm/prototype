import { useEffect } from "react";
import { applyKisTheme, teardownKisThemePresentation } from "./engine";
import { readKisTheme } from "./registry";

/** 首屏挂载展示层；切换由 ThemeSwitcher 调用 applyKisTheme。 */
export function ThemePresentationHost() {
  useEffect(() => {
    applyKisTheme(readKisTheme());
    return () => teardownKisThemePresentation();
  }, []);

  return null;
}
