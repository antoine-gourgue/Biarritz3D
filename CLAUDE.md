# Biarritz3D

Carte 3D immersive de Biarritz rendue avec les Google Photorealistic 3D Tiles et React Three Fiber.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui · React Three Fiber + three.js · 3d-tiles-renderer · Prisma + PostgreSQL · vitest

## Conventions

- Commits : conventional commits (vérifiés par husky en local et par le CI)
- CI : GitHub Actions autonome (`.github/workflows/ci.yml`) — checks `lint` / `typecheck` / `build` / `test`
- Images : `ghcr.io/antoine-gourgue/biarritz3d`
- Installs : `legacy-peer-deps=true` (`.npmrc`), requis par l'écosystème React 19. Utiliser les binaires `./node_modules/.bin/*` plutôt que `npx`.
- Rendu 3D : dans un client component chargé via `dynamic(..., { ssr: false })` — WebGL n'existe pas côté serveur.
- Client Prisma généré dans `src/generated/prisma` → importer depuis `@/generated/prisma` (pas `@prisma/client`).

## GitHub

- Project : antoine-gourgue/Biarritz-3d
- Board : les tickets sont créés par l'agent product-manager

<!-- Règles agent spécifiques à Next 16, auto-générées et maintenues par `next dev`. -->
@AGENTS.md
