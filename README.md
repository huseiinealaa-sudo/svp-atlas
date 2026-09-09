# SVP Atlas

An interactive 3D anatomy of a Honeywell Enraf / Calibron Small Volume Prover
(Model 85, tag **SVP-PR-8**), built in the style of the Human Atlas.

Orbit the machine, tap any component to learn what it is and what it does, pull the whole
assembly apart with the explode slider, and watch the internal mechanism operate.

The full specification is in [`SPEC.md`](./SPEC.md); the working rules are in
[`CLAUDE.md`](./CLAUDE.md).

## Build phases

| Phase | Scope | State |
|---|---|---|
| A | Skeleton — Vite + React + TS + Tailwind + R3F, one cylinder, touch orbit | complete |
| B | The ten geometry primitives, each demoed once | complete |
| **C** | The atlas — `parts.ts` (91 rows) + `Assembly.tsx` | complete |
| D | Interaction — select, isolate, systems, search, explode, cutaway, labels | not started |
| E | Content — ~91 bilingual entries | not started |
| F | Mechanism animation | not started |
| G | Numeric readout | not started |

## Running it

```bash
npm install
npm run dev        # dev server on http://localhost:5173/svp-atlas/
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript only
```

The dev server binds to all interfaces, so the **Network** URL it prints can be opened
directly on an iPad on the same network.

## Deployment

Every push to `main` builds the project and publishes `dist/` to GitHub Pages via
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). Because Pages serves the
site from a subpath, `vite.config.ts` sets `base: '/svp-atlas/'`.

**One-time setup on the repository:** Settings → Pages → *Build and deployment* →
Source = **GitHub Actions**. Until that is set, the deploy job will fail.

## Constraints

- No 3D asset files — all geometry is procedural.
- No browser storage — no `localStorage`, `sessionStorage`, `IndexedDB` or cookies.
- Every dimension in `src/data/` is in millimetres, converted once at the render boundary
  by `SCENE_SCALE`.
- Touch-first: the target device is an iPad Pro, verified at 1024×1366 and 1366×1024.

## Disclaimer

Educational model. Geometry is dimensionally proportioned from published Model 85 data and
the live SVP-PR-8 configuration; it is not a manufacturer CAD model. Refer to the Honeywell
Enraf manuals and API MPMS Chapters 4 and 12 for authoritative procedures.
