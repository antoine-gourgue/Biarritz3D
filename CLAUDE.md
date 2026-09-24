# Biarritz3D

Carte 3D immersive et fidèle de Biarritz : bâtiments (empreintes + hauteurs), rues, trait de côte, plages et parcs reconstruits en three.js à partir des données OpenStreetMap. Aucune API ni clé au runtime.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui · three.js (via React Three Fiber + drei) · zod · Prisma + PostgreSQL · vitest

## Conventions

- Commits : conventional commits (vérifiés par husky en local et par le CI)
- CI : GitHub Actions autonome (`.github/workflows/ci.yml`) — checks `lint` / `typecheck` / `build` / `test`
- Images : `ghcr.io/antoine-gourgue/biarritz3d`
- Installs : `legacy-peer-deps=true` (`.npmrc`), requis par l'écosystème React 19. Utiliser les binaires `./node_modules/.bin/*` plutôt que `npx`.
- Rendu 3D : dans un client component chargé via `dynamic(..., { ssr: false })` — WebGL n'existe pas côté serveur.
- Client Prisma généré dans `src/generated/prisma` → importer depuis `@/generated/prisma` (pas `@prisma/client`).

## Données de la ville

- `npm run data:fetch` interroge OpenStreetMap (Overpass, script `scripts/fetch-biarritz-osm.mjs`, à lancer en local, une fois) et régénère `public/data/biarritz.json` : bâtiments avec hauteur, voies classées, trait de côte → polygones de terre, plages, espaces verts, plans d'eau.
- Coordonnées en **mètres** autour de `BIARRITZ_CENTER` (x = est, z = sud, y = haut). Le `CENTER` du script et `BIARRITZ_CENTER` dans `src/lib/biarritz.ts` doivent rester identiques.
- Schéma validé par zod dans `src/lib/city-data.ts` ; constructeurs three.js purs (géométries fusionnées, couleurs par sommet) dans `src/components/map/geometry.ts`.
- Licence ODbL : l'attribution « © Contributeurs OpenStreetMap » doit rester visible dans l'UI.

## GitHub

- Project : antoine-gourgue/Biarritz-3d
- Board : les tickets sont créés par l'agent product-manager

<!-- Règles agent spécifiques à Next 16, auto-générées et maintenues par `next dev`. -->
@AGENTS.md
