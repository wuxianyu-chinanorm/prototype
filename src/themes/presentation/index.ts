import type { KisThemeId } from "../registry";
import type { ThemePresentationModule } from "./types";
import { atlasPresentation } from "./atlas";
import { beaconPresentation } from "./beacon";
import { clarityPresentation } from "./clarity";
import { lumenPresentation } from "./lumen";
import { notionPresentation } from "./notion";

const MODULES: ThemePresentationModule[] = [
  beaconPresentation,
  clarityPresentation,
  atlasPresentation,
  lumenPresentation,
  notionPresentation,
];

const byId = new Map(MODULES.map((m) => [m.id, m]));

export function getPresentationModule(id: KisThemeId): ThemePresentationModule | null {
  if (id === "classic") return null;
  return byId.get(id) ?? null;
}
