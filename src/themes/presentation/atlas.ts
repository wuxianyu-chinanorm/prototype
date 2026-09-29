import type { ThemePresentationModule } from "./types";
import { createPresentationObserver } from "./shared";

export const atlasPresentation: ThemePresentationModule = {
  id: "atlas",
  mount(host) {
    host.classList.add("kis-theme-surface--atlas");
    document.body.classList.add("kis-theme-body--atlas");

    const ambient = document.createElement("div");
    ambient.className = "kis-theme-ambient kis-theme-ambient--atlas";
    ambient.setAttribute("aria-hidden", "true");
    ambient.setAttribute("data-kis-enhanced", "inject");
    document.body.append(ambient);

    const stopObserver = createPresentationObserver(host, "atlas");

    return () => {
      stopObserver();
      ambient.remove();
      host.classList.remove("kis-theme-surface--atlas");
      document.body.classList.remove("kis-theme-body--atlas");
    };
  },
};
