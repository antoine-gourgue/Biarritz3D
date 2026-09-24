import type { GeoPoint } from "./biarritz";

export const poiCategories = [
  "plage",
  "lieu",
  "surf",
  "webcam",
  "parking",
] as const;
export type PoiCategory = (typeof poiCategories)[number];

export const POI_CATEGORY_LABEL: Record<PoiCategory, string> = {
  plage: "Plages",
  lieu: "Lieux",
  surf: "Surf",
  webcam: "Webcams",
  parking: "Parkings",
};

export type Poi = {
  readonly id: string;
  readonly name: string;
  readonly category: PoiCategory;
  /** Catégories secondaires (ex. une plage qui a une webcam et un spot de surf). */
  readonly tags?: readonly PoiCategory[];
  readonly point: GeoPoint;
  readonly description: string;
  /** Distance caméra (m) quand on « y va ». */
  readonly flyDistance: number;
  /** Flux webcam — branché en phase suivante. */
  readonly webcamUrl?: string;
  /** Affiché même sans filtre de catégorie (vue d'ensemble) ; les autres n'apparaissent qu'au filtre. */
  readonly featured?: boolean;
};

/** Un POI appartient à une catégorie par sa catégorie principale ou ses tags. */
export function poiMatches(poi: Poi, category: PoiCategory | null): boolean {
  return (
    category === null ||
    poi.category === category ||
    (poi.tags?.includes(category) ?? false)
  );
}

export const POIS: readonly Poi[] = [
  {
    id: "grande-plage",
    name: "Grande Plage",
    featured: true,
    category: "plage",
    tags: ["webcam", "surf"],
    point: { lat: 43.4855, lon: -1.5605 },
    description:
      "La plage emblématique du centre-ville, face au Casino et à l'Hôtel du Palais.",
    flyDistance: 900,
  },
  {
    id: "cote-des-basques",
    name: "Côte des Basques",
    featured: true,
    category: "surf",
    tags: ["plage", "webcam"],
    point: { lat: 43.478, lon: -1.568 },
    description:
      "Berceau du surf européen, au pied des falaises, vue sur les Pyrénées.",
    flyDistance: 900,
  },
  {
    id: "miramar",
    name: "Plage Miramar",
    category: "plage",
    point: { lat: 43.4885, lon: -1.5575 },
    description: "Prolongement de la Grande Plage vers le Phare, plus calme.",
    flyDistance: 700,
  },
  {
    id: "marbella",
    name: "Plage Marbella",
    category: "surf",
    tags: ["plage"],
    point: { lat: 43.4735, lon: -1.5715 },
    description: "Spot de surf au sud de la Côte des Basques, ambiance nature.",
    flyDistance: 800,
  },
  {
    id: "milady",
    name: "Plage de la Milady",
    category: "plage",
    tags: ["webcam", "surf"],
    point: { lat: 43.4685, lon: -1.5745 },
    description:
      "Plage familiale au sud de la ville, près de la Cité de l'Océan.",
    flyDistance: 800,
  },
  {
    id: "port-vieux",
    name: "Port Vieux",
    category: "plage",
    point: { lat: 43.4822, lon: -1.5672 },
    description: "Petite crique abritée, la plage des Biarrots toute l'année.",
    flyDistance: 450,
  },
  {
    id: "rocher-de-la-vierge",
    name: "Rocher de la Vierge",
    featured: true,
    category: "lieu",
    point: { lat: 43.4838, lon: -1.569 },
    description:
      "Le symbole de Biarritz, relié à la terre par sa passerelle métallique.",
    flyDistance: 500,
  },
  {
    id: "phare",
    name: "Phare de Biarritz",
    featured: true,
    category: "lieu",
    point: { lat: 43.4957, lon: -1.5534 },
    description:
      "73 m au-dessus de l'océan, à la pointe Saint-Martin, vue à 360°.",
    flyDistance: 600,
  },
  {
    id: "casino",
    name: "Casino municipal",
    featured: true,
    category: "lieu",
    point: { lat: 43.4838, lon: -1.559 },
    description: "Façade Art déco face à la Grande Plage.",
    flyDistance: 450,
  },
  {
    id: "hotel-du-palais",
    name: "Hôtel du Palais",
    featured: true,
    category: "lieu",
    point: { lat: 43.487, lon: -1.5562 },
    description: "Ancienne villa impériale d'Eugénie, palace en front de mer.",
    flyDistance: 500,
  },
  {
    id: "villa-belza",
    name: "Villa Belza",
    category: "lieu",
    point: { lat: 43.4813, lon: -1.5672 },
    description:
      "Silhouette néo-médiévale perchée sur son rocher, au bout de la Côte des Basques.",
    flyDistance: 450,
  },
  {
    id: "port-des-pecheurs",
    name: "Port des Pêcheurs",
    category: "lieu",
    point: { lat: 43.483, lon: -1.566 },
    description: "Crampottes colorées et restaurants au ras de l'eau.",
    flyDistance: 450,
  },
  {
    id: "musee-de-la-mer",
    name: "Musée de la Mer",
    category: "lieu",
    point: { lat: 43.4835, lon: -1.5705 },
    description: "Aquarium Art déco face au Rocher de la Vierge.",
    flyDistance: 450,
  },
  {
    id: "halles",
    name: "Les Halles",
    category: "lieu",
    point: { lat: 43.4807, lon: -1.5596 },
    description: "Le marché couvert, cœur gourmand de la ville.",
    flyDistance: 450,
  },
  {
    id: "gare-du-midi",
    name: "Gare du Midi",
    category: "lieu",
    point: { lat: 43.4793, lon: -1.558 },
    description: "Ancienne gare devenue salle de spectacle.",
    flyDistance: 450,
  },
  {
    id: "parking-casino",
    name: "Parking Casino",
    category: "parking",
    point: { lat: 43.4838, lon: -1.5585 },
    description: "Parking souterrain de la Grande Plage.",
    flyDistance: 400,
  },
  {
    id: "parking-sainte-eugenie",
    name: "Parking Sainte-Eugénie",
    category: "parking",
    point: { lat: 43.4823, lon: -1.5655 },
    description: "Parking du Port Vieux et du Rocher de la Vierge.",
    flyDistance: 400,
  },
  {
    id: "parking-bellevue",
    name: "Parking Bellevue",
    category: "parking",
    point: { lat: 43.485, lon: -1.5598 },
    description: "Parking du centre-ville, à côté du Bellevue.",
    flyDistance: 400,
  },
];
