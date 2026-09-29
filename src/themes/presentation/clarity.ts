import type { ThemePresentationModule } from "./types";
import { createPresentationObserver } from "./shared";

export const clarityPresentation: ThemePresentationModule = {
  id: "clarity",
  mount(host) {
    host.classList.add("kis-theme-surface--clarity");
    document.body.classList.add("kis-theme-body--clarity");

    const ambient = document.createElement("div");
    ambient.className = "kis-theme-ambient kis-theme-ambient--clarity";
    ambient.setAttribute("aria-hidden", "true");
    ambient.setAttribute("data-kis-enhanced", "inject");
    document.body.append(ambient);

    const stopObserver = createPresentationObserver(host, "clarity");

    return () => {
      stopObserver();
      ambient.remove();
      host.classList.remove("kis-theme-surface--clarity");
      document.body.classList.remove("kis-theme-body--clarity");
    };
  },
};
