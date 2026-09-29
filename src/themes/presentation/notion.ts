import type { ThemePresentationModule } from "./types";
import { createPresentationObserver } from "./shared";

export const notionPresentation: ThemePresentationModule = {
  id: "notion",
  mount(host) {
    host.classList.add("kis-theme-surface--notion");
    document.body.classList.add("kis-theme-body--notion");
    document.documentElement.classList.add("kis-notion-root");

    const stopObserver = createPresentationObserver(host, "notion");

    return () => {
      stopObserver();
      host.classList.remove("kis-theme-surface--notion");
      document.body.classList.remove("kis-theme-body--notion");
      document.documentElement.classList.remove("kis-notion-root");
    };
  },
};
