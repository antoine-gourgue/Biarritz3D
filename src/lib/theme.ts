export type ThemeId = "dark" | "light";

/** Palette complète d'un thème : rendu 3D (three.js) + classes Tailwind de l'UI. */
export type MapTheme = {
  readonly id: ThemeId;
  readonly label: string;
  /** Ciel : dégradé du zénith (`skyTop`) vers l'horizon (`horizon`, aussi couleur de brume). */
  readonly skyTop: string;
  readonly horizon: string;
  readonly fog: { readonly near: number; readonly far: number };
  /** Sol. */
  readonly land: string;
  readonly beach: string;
  readonly green: string;
  readonly lake: string;
  /** Océan (shader animé). */
  readonly oceanDeep: string;
  readonly oceanShallow: string;
  readonly oceanHighlight: string;
  /** Bâtiments : dégradé bas → haut, toit, arêtes. */
  readonly wallBottom: string;
  readonly wallTop: string;
  readonly roof: string;
  readonly edge: string;
  readonly edgeOpacity: number;
  /** Voies par importance ; `roadsGlow` = non tone-mappées pour briller avec le bloom. */
  readonly roadMajor: string;
  readonly roadMedium: string;
  readonly roadMinor: string;
  readonly roadPedestrian: string;
  readonly roadPath: string;
  readonly roadsGlow: boolean;
  /** Lumière : soleil + lumière d'appoint opposée (modelé des façades). */
  readonly sunPosition: readonly [number, number, number];
  readonly sunIntensity: number;
  readonly sunColor: string;
  readonly fillIntensity: number;
  readonly fillColor: string;
  readonly skyLight: string;
  readonly groundLight: string;
  readonly hemiIntensity: number;
  readonly shadows: boolean;
  readonly bloom: boolean;
  /** Accent des POI et de l'UI. */
  readonly accent: string;
  /** Classes Tailwind de l'interface. */
  readonly ui: {
    readonly root: string;
    readonly glass: string;
    readonly glassStrong: string;
    readonly muted: string;
    readonly chip: string;
    readonly chipActive: string;
    readonly button: string;
    readonly accentText: string;
    readonly label: string;
    readonly labelActive: string;
  };
};

export const darkTheme: MapTheme = {
  id: "dark",
  label: "Nuit",
  skyTop: "#04070d",
  horizon: "#10192b",
  fog: { near: 1800, far: 9500 },
  land: "#161c27",
  beach: "#3b362d",
  green: "#18271f",
  lake: "#0f2b46",
  oceanDeep: "#08172c",
  oceanShallow: "#12345a",
  oceanHighlight: "#5f9bd6",
  wallBottom: "#1a2130",
  wallTop: "#6a7896",
  roof: "#46506a",
  edge: "#adc8ff",
  edgeOpacity: 0.22,
  roadMajor: "#dfe9ff",
  roadMedium: "#93a6c4",
  roadMinor: "#4f5d78",
  roadPedestrian: "#43506a",
  roadPath: "#232c3c",
  roadsGlow: true,
  sunPosition: [-1800, 2200, 1400],
  sunIntensity: 0.95,
  sunColor: "#dfe8ff",
  fillIntensity: 0.35,
  fillColor: "#6a8fd8",
  skyLight: "#5d7fb4",
  groundLight: "#0a0e16",
  hemiIntensity: 1.0,
  shadows: false,
  bloom: true,
  accent: "#62e3ff",
  ui: {
    root: "bg-[#0a0f1a] text-white",
    glass: "border-white/10 bg-[#0b111c]/70",
    glassStrong: "border-white/10 bg-[#0d1420]/92",
    muted: "text-white/60",
    chip: "border-white/10 bg-white/6 text-white/85 active:bg-white/15",
    chipActive: "border-transparent bg-cyan-300 text-slate-950",
    button: "bg-cyan-300 text-slate-950 active:bg-cyan-200",
    accentText: "text-cyan-300",
    label: "border-white/12 bg-[#0b111c]/78 text-white/92",
    labelActive: "border-transparent bg-cyan-300 text-slate-950",
  },
};

export const lightTheme: MapTheme = {
  id: "light",
  label: "Jour",
  skyTop: "#7fb3e0",
  horizon: "#d3e2ef",
  fog: { near: 2500, far: 14000 },
  land: "#efece6",
  beach: "#f3e4bf",
  green: "#c3dbb0",
  lake: "#8fc5e8",
  oceanDeep: "#2f86c8",
  oceanShallow: "#5db3e2",
  oceanHighlight: "#eaf8ff",
  wallBottom: "#d8d3cb",
  wallTop: "#ffffff",
  roof: "#ebe7e0",
  edge: "#5f6673",
  edgeOpacity: 0.16,
  roadMajor: "#ffffff",
  roadMedium: "#fbfaf7",
  roadMinor: "#e6e1d8",
  roadPedestrian: "#dfd8cc",
  roadPath: "#e7e3db",
  roadsGlow: false,
  sunPosition: [-2200, 1700, 1600],
  sunIntensity: 2.6,
  sunColor: "#fff4e0",
  fillIntensity: 0.55,
  fillColor: "#dbe8ff",
  skyLight: "#eef5ff",
  groundLight: "#b9b1a5",
  hemiIntensity: 0.9,
  shadows: true,
  bloom: false,
  accent: "#0a84ff",
  ui: {
    root: "bg-[#d3e2ef] text-slate-900",
    glass: "border-black/8 bg-white/72",
    glassStrong: "border-black/8 bg-white/95",
    muted: "text-slate-600",
    chip: "border-black/8 bg-white/70 text-slate-800 active:bg-white",
    chipActive: "border-transparent bg-blue-600 text-white",
    button: "bg-blue-600 text-white active:bg-blue-500",
    accentText: "text-blue-600",
    label: "border-black/10 bg-white/85 text-slate-900",
    labelActive: "border-transparent bg-blue-600 text-white",
  },
};

export const THEMES: Record<ThemeId, MapTheme> = {
  dark: darkTheme,
  light: lightTheme,
};
