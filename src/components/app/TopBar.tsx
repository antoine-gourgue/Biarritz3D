"use client";

import { Moon, Sun } from "lucide-react";

import { useMapState } from "@/components/map/store";
import { cn } from "@/lib/utils";

/** Barre haute : marque, attribution OSM (ODbL) et bascule jour / nuit. */
export default function TopBar() {
  const { theme, toggleTheme } = useMapState();
  const dark = theme.id === "dark";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-4 p-3 sm:p-4">
      <div
        className={cn(
          "pointer-events-auto rounded-2xl border px-4 py-2.5 backdrop-blur-xl",
          theme.ui.glass,
        )}
      >
        <h1 className="text-lg leading-tight font-semibold tracking-tight sm:text-xl">
          Biarritz <span className={theme.ui.accentText}>3D</span>
        </h1>
        <p className={cn("text-[11px] leading-tight", theme.ui.muted)}>
          ©{" "}
          <a
            className="underline-offset-2 hover:underline"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contributeurs OpenStreetMap
          </a>
        </p>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={dark ? "Passer en mode jour" : "Passer en mode nuit"}
        className={cn(
          "pointer-events-auto grid size-14 place-items-center rounded-2xl border shadow-lg backdrop-blur-xl transition-transform active:scale-95",
          theme.ui.glass,
        )}
      >
        {dark ? <Sun className="size-6" /> : <Moon className="size-6" />}
      </button>
    </header>
  );
}
