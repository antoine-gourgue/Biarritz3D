"use client";

import dynamic from "next/dynamic";

import BottomSheet from "@/components/app/BottomSheet";
import Dock from "@/components/app/Dock";
import TopBar from "@/components/app/TopBar";
import { cn } from "@/lib/utils";

import { MapStateProvider, useMapState } from "./store";

// La scène WebGL n'existe que côté navigateur : dynamic ssr:false la sort du
// rendu serveur et du bundle initial.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-3 rounded-full bg-black/50 px-5 py-3 text-base text-white backdrop-blur">
        <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        Chargement de la 3D…
      </div>
    </div>
  ),
});

export default function MapView() {
  return (
    <MapStateProvider>
      <Shell />
    </MapStateProvider>
  );
}

function Shell() {
  const { theme } = useMapState();
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden select-none",
        theme.ui.root,
      )}
    >
      <Scene />
      <TopBar />
      <Dock />
      <BottomSheet />
    </div>
  );
}
