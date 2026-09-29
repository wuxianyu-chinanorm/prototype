import type { ThemePresentationModule } from "./types";
import { createPresentationObserver } from "./shared";

export const beaconPresentation: ThemePresentationModule = {
  id: "beacon",
  mount(host) {
    host.classList.add("kis-theme-surface--beacon");
    document.body.classList.add("kis-theme-body--beacon");

    const ambient = document.createElement("div");
    ambient.className = "kis-theme-ambient kis-theme-ambient--beacon";
    ambient.setAttribute("aria-hidden", "true");
    ambient.setAttribute("data-kis-enhanced", "inject");
    document.body.append(ambient);

    const stopObserver = createPresentationObserver(host, "beacon");

    return () => {
      stopObserver();
      ambient.remove();
      host.classList.remove("kis-theme-surface--beacon");
      document.body.classList.remove("kis-theme-body--beacon");
    };
  },
};
