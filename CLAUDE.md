# CLAUDE.md — SVP Interactive Atlas

Full specification: `SPEC.md` at the project root. **Read it before writing any code.**
This file exists so the rules below survive context compaction. If you have compacted and are
unsure where you are, re-read `SPEC.md` §11 and check the phase tracker below.

## What this project is

An interactive 3D **anatomy** of a Honeywell Enraf / Calibron Small Volume Prover, in the style of
the Human Atlas. The user orbits the machine, taps any of ~93 components to learn what it is,
explodes the whole assembly apart, and watches the internal mechanism operate.

## Priority order — cut from the bottom, never the top

1. **The parts.** ~93 selectable components with real OEM item numbers.
2. **Exploration.** Explode, isolate, hide-by-system, search.
3. **Content.** Bilingual function + failure mode for every part.
4. **Mechanism animation.** Piston, poppet, guide block, flag, chains, fluid.
5. **Numeric readout.** Small card. Build last. Never let it delay 1–4.

An atlas with 93 labelled parts and no calculation engine is a success.
A calculation engine with 20 parts is a failure.

## Non-negotiable rules

1. **No 3D asset files.** No `.glb` / `.gltf` / `.obj` / `.fbx`, no Blender, no downloaded models.
   All geometry is procedural.
2. **No browser storage.** No `localStorage`, `sessionStorage`, `IndexedDB`, cookies.
3. **Primitive-driven.** ~10 primitive builders + one data table of ~93 rows. Never one component
   per part. If you are writing `Poppet.tsx`, stop — it should be a row in `parts.ts`.
4. **Part IDs are frozen** once written.
5. **All dimensions in millimetres** in `src/data/`. Convert once at the render boundary with
   `SCENE_SCALE = 0.001`. Never hard-code a dimension inside a component.
6. **Touch-first.** Target device is an iPad Pro. Orbit, pinch-zoom and tap-select must work with
   touch. Hit targets ≥ 44 px. Verify at 1024×1366 and 1366×1024.
7. **No corrections engine, no Water Draw module.** Out of scope for this build.

## Two things the model got wrong, now corrected — do not reintroduce them

1. **The fluid does not enter or leave along the axis.** Both ends of the flow tube are closed
   around the piston's two shafts, and the published envelope has no room above or beside the
   tube. Inlet and outlet are **radial nozzles hanging under the body**, and the fluid runs the
   bore **through the open Poppet inside the Piston**. SPEC.md §4.8.
2. **The drive never latches the piston.** It holds the **poppet actuator shaft** — the Upstream
   Shaft `54004`. Pulling it upstream drags the piston back *and holds the Poppet open*.
   `LAUNCH` is the **Puller releasing that shaft**: the Piston Spring shuts the Poppet and the
   flow, not the drive, carries the piston downstream. SPEC.md §5 system 7 and §8.

## The one insight the app must teach

The optical volume switches never see the piston. They see the **Flag (24005)** — a thin blade on
the **Guide Block (24001)** bolted to the piston's upstream shaft, riding the **Bearing Guide Bars
(24003)** on **Cam Followers (24002)**. Make this unmistakable in both the 3D animation and the
content.

## Language rule

Technical terms, part names, field names and unit symbols stay in **English exactly as written in
SPEC.md**. Explanatory prose is **Modern Standard Arabic**. Never translate: `Poppet`, `Detector`,
`Displacer`, `Flow Tube`, `Switch Bar`, `Guide Block`, `Flag`, `Prover`, `Cam Follower`,
`Igus Bushing`, `Belleville Spring`, `Meter Factor`, `Pre-Travel`.

Panels are RTL. The 3D canvas stays LTR.

## Reference images

`reference/` holds scans from the manufacturer manuals. **Do not embed them in the application** —
they are proprietary. Open one only if you need to clarify the physical arrangement during Phase C.

## Git workflow

Approval is required at **phase boundaries**, not at every commit. This project is driven from an
iPad; asking for approval on each file write would make the build impossible to finish.

- Work on a branch named `claude/phase-<letter>`, one branch per build phase.
- Inside a phase, commit freely and as often as is useful. No approval needed per commit.
- At the end of each phase: push, open a Pull Request toward `main`, update the phase tracker
  below, and **stop and report**. Wait for approval before starting the next phase.
- Never merge to `main` yourself. Never push directly to `main`.
- Never force-push, never rewrite history, never delete a branch that has an open PR.
- If something outside the current phase needs changing, say so in the PR description rather than
  doing it silently.

## Phase tracker — update this line as you go

```
CURRENT PHASE: D merged into main (PR #4, 86ccb82). E not started.
Interleaved: claude/fix-geometry — a research-and-correction pass on the flow path and the
piston return mechanism, after the project owner (who has inspected the machine) reported
both were wrong. Part count 91 → 93. See SPEC.md §4.8 and §14.
```

A skeleton · B primitives · C atlas (~93 parts) · D interaction · E content · F mechanism ·
G readout. Do not start a phase before the previous one is verified. **Phase C is the milestone
that matters most.**

## Commands

```
npm run dev              # dev server
npm run build            # typecheck + production build
npm run verify:explode   # proves explode 0 → 100 → 0 returns exact transforms
```

`scripts/verify-interaction.mjs` drives the built application in a real browser at both
iPad orientations. It needs a Playwright install and a served build, so it is not wired into
`package.json`; the header comment in the file says how to run it.
