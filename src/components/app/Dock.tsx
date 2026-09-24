"use client";

import {
  Camera,
  Car,
  Landmark,
  LocateFixed,
  Map as MapIcon,
  Waves,
} from "lucide-react";
import type { ComponentType } from "react";

import { useMapState } from "@/components/map/store";
import {
  POI_CATEGORY_LABEL,
  poiCategories,
  type PoiCategory,
} from "@/lib/pois";
import { cn } from "@/lib/utils";

const ICONS: Record<PoiCategory, ComponentType<{ className?: string }>> = {
  plage: Waves,
  lieu: Landmark,
  surf: Waves,
  webcam: Camera,
  parking: Car,
};

/** Dock bas façon CarPlay : catégories (cibles ≥ 56 px) + recentrage. */
export default function Dock() {
  const { theme, category, setCategory, recenter, selectedPoiId } =
    useMapState();
  const hidden = selectedPoiId !== null;

  return (
    <nav
      aria-label="Catégories"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 sm:p-4",
        hidden && "translate-y-full",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex min-w-0 flex-1 gap-2 overflow-x-auto rounded-3xl border p-2 shadow-2xl backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          theme.ui.glass,
        )}
      >
        <Chip
          active={category === null}
          onClick={() => setCategory(null)}
          icon={MapIcon}
          label="Tout"
          theme={theme}
        />
        {poiCategories.map((id) => (
          <Chip
            key={id}
            active={category === id}
            onClick={() => setCategory(id)}
            icon={ICONS[id]}
            label={POI_CATEGORY_LABEL[id]}
            theme={theme}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={recenter}
        aria-label="Recentrer sur Biarritz"
        className={cn(
          "pointer-events-auto grid size-16 shrink-0 place-items-center rounded-3xl border shadow-2xl backdrop-blur-xl transition-transform active:scale-95",
          theme.ui.glass,
        )}
      >
        <LocateFixed className="size-7" />
      </button>
    </nav>
  );
}

function Chip({
  active,
  onClick,
  icon: Icon,
  label,
  theme,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  theme: ReturnType<typeof useMapState>["theme"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-14 shrink-0 items-center gap-2.5 rounded-2xl border px-5 text-base font-medium transition-[transform,background-color] active:scale-95",
        active ? theme.ui.chipActive : theme.ui.chip,
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}
