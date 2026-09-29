import type { ThemePresentationModule } from "./types";
import { createPresentationObserver } from "./shared";

export const lumenPresentation: ThemePresentationModule = {
  id: "lumen",
  mount(host) {
    host.classList.add("kis-theme-surface--lumen");
    document.body.classList.add("kis-theme-body--lumen");

    const ambient = document.createElement("div");
    ambient.className = "kis-theme-ambient kis-theme-ambient--lumen";
    ambient.setAttribute("aria-hidden", "true");
    ambient.setAttribute("data-kis-enhanced", "inject");
    document.body.append(ambient);

    const stopObserver = createPresentationObserver(host, "lumen");

    return () => {
      stopObserver();
      ambient.remove();
      host.classList.remove("kis-theme-surface--lumen");
      document.body.classList.remove("kis-theme-body--lumen");
    };
  },
};
