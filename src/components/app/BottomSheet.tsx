"use client";

import { Navigation, Video, X } from "lucide-react";

import { useMapState } from "@/components/map/store";
import { projectToLocal } from "@/lib/biarritz";
import { POI_CATEGORY_LABEL, POIS } from "@/lib/pois";
import { cn } from "@/lib/utils";

/** Fiche lieu façon CarPlay : volet qui remonte du bas, zone webcam, actions larges. */
export default function BottomSheet() {
  const { theme, selectedPoiId, selectPoi, flyToLocal } = useMapState();
  const poi = POIS.find((candidate) => candidate.id === selectedPoiId) ?? null;
  const open = poi !== null;

  return (
    <section
      aria-hidden={!open}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 mx-auto flex h-[min(48dvh,26rem)] w-full max-w-3xl flex-col rounded-t-[2rem] border shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out",
        theme.ui.glassStrong,
        open ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-current opacity-25" />

      {poi && (
        <>
          <header className="flex items-start justify-between gap-4 px-6 pt-4">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold tracking-widest uppercase",
                  theme.ui.accentText,
                )}
              >
                {POI_CATEGORY_LABEL[poi.category]}
              </p>
              <h2 className="truncate text-2xl leading-tight font-semibold tracking-tight">
                {poi.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => selectPoi(null)}
              aria-label="Fermer"
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl border transition-transform active:scale-95",
                theme.ui.chip,
              )}
            >
              <X className="size-6" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pt-4 pb-5">
            <p className={cn("text-base leading-relaxed", theme.ui.muted)}>
              {poi.description}
            </p>

            <div
              className={cn(
                "relative flex flex-1 min-h-24 items-center justify-center overflow-hidden rounded-2xl border",
                theme.ui.chip,
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-blue-500/15" />
              <div className="relative flex items-center gap-3">
                <Video className="size-6" />
                <span className="text-sm font-medium">
                  {poi.tags?.includes("webcam")
                    ? "Webcam en direct — flux à venir"
                    : "Pas de webcam sur ce lieu"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const [x, z] = projectToLocal(poi.point);
                flyToLocal(x, z, poi.flyDistance);
              }}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2.5 rounded-2xl text-base font-semibold transition-transform active:scale-[0.98]",
                theme.ui.button,
              )}
            >
              <Navigation className="size-5" />Y aller
            </button>
          </div>
        </>
      )}
    </section>
  );
}
