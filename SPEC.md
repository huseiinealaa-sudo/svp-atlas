# SPEC.md — SVP Interactive Atlas

**What this is:** an interactive 3D anatomy of a Honeywell Enraf / Calibron Small Volume Prover
(Model 85, tag SVP-PR-8). The user orbits the machine, taps any component to learn what it is and
what it does, drags a slider to pull the whole assembly apart into its individual pieces, and
watches the internal mechanism operate.

**The model is Human Atlas, applied to industrial equipment.** The value of this application is
*anatomical* — knowing every piece, where it sits, what it touches, what it does, and what happens
when it fails. Calculations are a small readout at the end, not the point.

**Execution instruction:** read this whole file, then build the whole application. Do not ask
clarifying questions — every value you need is here. Follow the Build Phases in §11 in order.

---

## 0. Priorities — read this before anything else

| Rank | What | Why |
|---|---|---|
| **1** | The parts. 93 individually selectable components with real OEM item numbers. | This is the product. |
| **2** | Explode / assemble, isolate, hide-by-system, search. | This is how the user explores. |
| **3** | Rich bilingual content per part: function and failure mode. | This makes it teaching, not decoration. |
| **4** | Visual animation of the internal mechanism during a prove. | This is "seeing what happens inside." |
| **5** | A compact numeric readout at the end of a run. | Nice to have. Build it last. |

If you run short of time or context, **cut from the bottom, never from the top.** An atlas with 93
beautifully labelled parts and no calculation engine is a success. A calculation engine with 20
parts is a failure.

---

## 1. Non-negotiable rules

1. **No 3D asset files.** No `.glb` / `.gltf` / `.obj` / `.fbx`, no Blender, no downloaded models.
   All geometry is procedural.
2. **No browser storage.** No `localStorage`, `sessionStorage`, `IndexedDB`, cookies. State is in
   memory only.
3. **Primitive-driven geometry.** Do NOT write one React component per part. Write ~10 primitive
   builders and let a data table instantiate all 93 parts. See §4.
4. **Part IDs are frozen** once written.
5. **All dimensions in millimetres** in `src/data/`. Convert once at the render boundary with
   `SCENE_SCALE = 0.001`.
6. **Touch-first.** The primary viewing device is an iPad Pro. Orbit, pinch-zoom and tap-select
   must work with touch. Hit targets no smaller than 44 px. Verify the layout at 1024×1366
   portrait and 1366×1024 landscape.

---

## 2. Stack

```
Vite + React 18 + TypeScript (strict)
@react-three/fiber · @react-three/drei · three
zustand
tailwindcss
```

Nothing else. No UI library, no physics engine, no CFD.

---

## 3. Structure

```
svp-atlas/
├── index.html · package.json · tsconfig.json · vite.config.ts · tailwind.config.js
└── src/
    ├── main.tsx · App.tsx · index.css
    ├── data/
    │   ├── geometry.ts      # dimensional constants, mm
    │   ├── parts.ts         # THE PART TABLE — 93 rows, drives everything
    │   ├── content.ts       # bilingual text per part
    │   └── siteData.ts      # SVP-PR-8 identity + reference run
    ├── three/
    │   ├── Scene.tsx        # canvas, lights, camera, OrbitControls (touch enabled)
    │   ├── Assembly.tsx     # maps over parts.ts and renders each via a primitive
    │   ├── primitives/      # ~10 builders — see §4.2
    │   ├── Mechanism.tsx    # animated piston / poppet / guide block / flag / chain
    │   ├── FluidFlow.tsx    # particle stream
    │   └── Labels.tsx       # leader lines + floating labels when exploded
    ├── sim/                 # pure TS. No react, no three.
    │   ├── cycle.ts         # the visual state machine
    │   └── calc.ts          # the small numeric readout (Phase G only)
    ├── store/useStore.ts
    └── ui/
        ├── Header.tsx · SearchBar.tsx · SystemsPanel.tsx · InfoCard.tsx
        ├── ExplodeSlider.tsx · ViewCube.tsx · MechanismPanel.tsx · ResultReadout.tsx
```

---

## 4. Geometry — primitive-driven

### 4.1 The rule

`parts.ts` is a flat array of 93 rows. Each row names a **primitive** and its parameters.
`Assembly.tsx` maps over the array and renders each row. Adding a part means adding a row, never
writing a component. This is what makes 93 parts affordable in a single build.

```ts
export interface Part {
  id: string;              // frozen, e.g. 'SVP-PIS-54003'
  oem: string | null;      // real Calibron item number, e.g. '54003'
  nameEn: string;
  system: SystemId;
  primitive: PrimitiveId;
  params: Record<string, number>;
  position: [number, number, number];   // mm, assembled
  rotation?: [number, number, number];  // radians
  explodeDir: [number, number, number]; // normalised at load
  explodeDist: number;                  // mm at 100 %
  color: string;
  qty?: number;            // for instanced sets (bolts, seals, o-rings)
  instance?: { pattern: 'circle' | 'linear'; radius?: number; spacing?: number; axis?: 'x'|'y'|'z' };
}
```

### 4.2 The ten primitives

| id | Built from | Used for |
|---|---|---|
| `tube` | two concentric `CylinderGeometry` | flow tube, bushings, sleeves, process nozzles |
| `disc` | `CylinderGeometry`, short | flanges, stops, retainers, washers |
| `rod` | `CylinderGeometry`, long and thin | shafts, guide bars, studs |
| `ring` | `TorusGeometry` | o-rings, seals, retaining rings |
| `cone` | `ConeGeometry` / tapered cylinder | poppet, tapered seats |
| `helix` | `CatmullRomCurve3` + `TubeGeometry` | springs, chains |
| `box` | `BoxGeometry` | switch bar, guide block, base skid, enclosures |
| `pipe` | `CatmullRomCurve3` + `TubeGeometry` | swept runs and closed loops — the return chains |
| `bolt` | small cylinder + hex head, via `InstancedMesh` | every bolt set |
| `probe` | cylinder + stem | RTDs, pressure transmitter, optical switches |

`bolt` and `ring` sets use `InstancedMesh` with the `instance` pattern. A 20-bolt flange set is
**one part row and one draw call**, but still selects and explodes as a unit.

### 4.3 Coordinate system

Origin `[0,0,0]` = centre of the flow tube bore, at the axial midpoint of the calibrated section.
**+X = direction of flow.** +Y = up. +Z = toward viewer; the drive assembly sits at −Z.

Flow runs along +X *inside the bore*, but it does not arrive or leave along +X: it enters and
exits through nozzles at −Y, under the body. See §4.8. Everything at −Z — switch bar, guide
block, chains, puller — must stay inside `overallWidth / 2` = 635.

### 4.4 Verified dimensions — manufacturer manual, Model 85

Source: Calibron SVP Operation & Installation Manual, doc 44103445 Rev 0, Figure 1.

```ts
export const OVERALL = {
  baseLength: 5230, overallWidth: 1270, overallHeight: 1230,
  centrelineHeight: 762, dimE: 1930, dimF: 2110,
} as const;
```

### 4.5 Verified — live WinSFC configuration of SVP-PR-8

```ts
export const FLOW_TUBE = {
  innerDiameter: 673.11,   // "Prover Diameter (ID)" 67.311 cm
  wallThickness:  73.835,  // "Wall Thickness" 7.3835 cm   [VERIFY UNIT ON SITE]
  outerDiameter: 820.78,
  length:       1930,
} as const;
```

Flanges: the manual lists 12 inch for Model 85, but **SVP-PR-8 is built with 10 inch ANSI 600#.**
Model 10 inch.

### 4.6 Derived — computed from the above, not guessed

```
bore area          = π/4 × 0.67311²          = 0.355838 m²
calibrated stroke  = 0.28415 / 0.355838      = 798.5 mm
pre-travel (25 %)                            = 199.6 mm
```

```ts
export const TRAVEL = {
  calibratedStroke: 798.5, preTravel: 199.6, postTravel: 150 /*[EST]*/, boreAreaM2: 0.355838,
} as const;
export const AXIAL = {
  detector1X: -399.25, detector2X: +399.25, launchX: -598.85, stopX: +549.25,
} as const;
```

### 4.7 Proportional estimates — `[EST]`, appearance only

```ts
export const EST = {
  pistonBodyDia: 670, pistonBodyLen: 240,
  poppetDia: 300, poppetLen: 140, poppetOpenTravel: 60,
  shaftDia: 70, shaftLen: 1400,
  flangeOD: 900, flangeThk: 90, flangeBolts: 20, flangeBoltCircle: 780,
  switchBarLen: 1400, switchBarW: 90, switchBarH: 70, switchBarZ: -520,
  guideBarLen: 2000, guideBarDia: 40, guideBlockW: 220, guideBlockH: 160, guideBlockD: 180,
  flagLen: 120, flagW: 8, flagH: 60,
  detectorDia: 46, detectorLen: 130,
  motorDia: 260, motorLen: 420, motorX: -1500, gearboxW: 380,
  chainZ: -580, chainSpacing: 100, driveZ: -600,   // see the envelope note below
  baseLen: 5230, baseW: 1270, baseThk: 160,
  instrDia: 90, instrLen: 220, instrStem: 180,
  boltDia: 24, boltLen: 110, oRingTube: 10,
} as const;
```

The process connections are no longer proportional estimates: they are constrained
geometry, and live in `PORTS` — see §4.8.

`chainZ` is bounded, not free. `overallWidth` 1270 allows ±635 about the axis, so the
return drive has to live inside that: at the old −640 ± 60 the chains hung 65 mm outside
the machine they belong to.

---

### 4.8 Verified — the process connections and the flow path

**The inlet and outlet are radial nozzles on the underside of the body.** They are not
axial connections at the ends of the flow tube. Three independent facts force this, and
they agree with one another:

1. **Both ends of the flow tube are closed.** The piston carries an Upstream Shaft
   (`54004`) and a Downstream Shaft (`54005`), each running out through a shaft-sealed
   head — items `52102` / `52104` upstream and `53102` / `53104` downstream. Neither end
   is open, so no axial process connection is possible.
2. **The published envelope leaves only one direction.** From §4.4: overall height 1230
   with the bore centreline at 762 puts the top of the 820.78 OD tube at 1172 — 58 mm of
   headroom, so no top nozzle fits. Overall width 1270 gives ±635 about the axis, and a
   10" 600# flange is 508 OD on its own, so no side nozzle fits either. Under the tube
   there are 762 − 410 = 352 mm, which a nozzle and its flange do fit into.
3. **Honeywell says so.** "An inlet port and an outlet port can be located at the bottom
   of the cylindrical object", the outlet "welded at the bottom of the bore cylinder so
   that foreign material can flow directly out of the prover bore cylinder via the outlet
   port" — US 8,511,138 B2 and US 8,950,235 B2. The bottom outlet is deliberate: solids
   that settle out of the stream leave with the flow instead of collecting in the bore.

So the path is: **in through the bottom nozzle below the upstream end → the length of the
bore, passing straight through the open Poppet inside the Piston → out through the bottom
nozzle below the downstream end.** The fluid never bypasses the piston around an annulus;
it goes *through* it. That is the Calibron architecture.

```ts
export const PORTS = {
  bore: 254, wall: 20,
  inletX: -900 /*[EST]*/, outletX: 900 /*[EST]*/,
  topY: -300 /*[EST]*/, nozzleLength: 360 /*[EST]*/,
  flangeOD: 508, flangeThk: 66,
} as const;
```

Axial placement is `[EST]` under one hard constraint: **a port may not open into the
piston's swept path**, or the piston seal would ride across it. The piston reaches
x = −718.85 at launch and x = +669.25 at the stop, so both ports sit outboard of the
travel. What happens beyond the prover's own connection flanges is site piping and is
**not modelled**.

## 5. The part table — 93 rows

Ten systems. OEM numbers are **real Calibron item numbers** from the maintenance chapter of doc
44103445 Rev 0 — display them, they are what makes this authentic.

### System 1 · `flowtube` — Flow Tube & Body (6)

| id | oem | Name EN |
|---|---|---|
| `SVP-BOD-FT01` | — | Flow Tube (Honed Measurement Cylinder) |
| `SVP-BOD-52201` | 52201 | Upstream Flange |
| `SVP-BOD-52205` | 52205 | Upstream Flange O-Ring Seal |
| `SVP-BOD-53001` | 53001 | Downstream Flange |
| `SVP-BOD-53002` | 53002 | O-Ring Seal Downstream Flange |
| `SVP-BOD-53003` | 53003 | Flange Retaining Bolt Set |

### System 2 · `piston` — Piston Assembly (15) — ID pattern `SVP-PIS-<oem>`

`54001` Piston Body · `54002` Piston Support · `54003` Poppet · `54004` Upstream Shaft ·
`54005` Downstream Shaft · `54006` Belleville Retainer Washer · `54008` Piston Seal Rider ·
`54009` Piston Spring · `54010` Piston Belleville Spring · `54011` Igus Bushing ·
`54013` Piston Seal · `54014` Poppet Seal · `54017` Belleville Retainer Seal ·
`54018` Socket Head Cap Screw · `54020` Hex Head Bolt

### System 3 · `upstream` — Upstream Seal Retainer & Flange (15) — `SVP-UPS-<oem>`

`52101` Upstream Seal Retainer · `52102` Shaft Seal Upstream Outer · `52103` Igus Bushing ·
`52104` Shaft Seal · `52106` Retaining Ring · `52107` Socket Head Cap Screw ·
`52108` Shock Absorber · `52109` Teflon O-Ring Seal · `52110` Ryton Washer ·
`52112` Notched Ryton Washer · `52202` Belleville Spring · `52203` Washer Belleville Retainer ·
`52204` Retaining Ring · `52206` Socket Head Cap Screw · `52207` Hex Head Cap Screw

### System 4 · `downstream` — Downstream Stop & Seal Retainer (12) — `SVP-DWN-<oem>`

`53101` Downstream Stop · `53102` Shaft Seal · `53103` Igus Bushing · `53104` Shaft Seal ·
`53105` Notched Ryton Washer · `53106` Retaining Ring · `53107` Downstream Stop Retaining Bolt ·
`53108` O-Ring Seal Downstream Stop · `53109` Downstream Seal Retainer ·
`53110` Downstream Seal Retainer Bolt · `53111` O-Ring Seal · `53112` Ryton Washer

### System 5 · `guideblock` — Guide Block & Flag (12) — `SVP-GDB-<oem>`

`24001` Guide Block · `24002` Cam Follower · `24003` Bearing Guide Bar ·
`24004` Bearing Guide Bar Shim · `24005` **Flag** · `24008` Motor Stop Ramp ·
`24009` Socket Head Cap Screw · `24010` Lock Washer · `24011` Ground Strap ·
`24012` Socket Head Cap Screw · `24018` Socket Head Cap Screw · `24019` Cam Follower

> **This system is the key to understanding the machine.** The optical volume switches never see
> the piston. They see the **Flag (24005)**, a thin blade bolted to the **Guide Block (24001)**,
> which is bolted to the piston's upstream shaft and rides the **Bearing Guide Bars (24003)** on
> **Cam Followers (24002)**. The **Motor Stop Ramp (24008)** trips the motor stop micro switch at
> the end of the return travel. Give this system prominent treatment in the content.

### System 6 · `detection` — Detection (5)

`SVP-DET-01` Upstream Optical Volume Switch (Detector 1) ·
`SVP-DET-02` Downstream Optical Volume Switch (Detector 2) ·
`SVP-DET-SB` Switch Bar · `SVP-DET-TW` Switch Bar Thermowell ·
`SVP-DET-MS` Motor Stop Micro Switch

### System 7 · `drive` — Return Drive (10)

`SVP-DRV-MOT` Return Drive Motor (Explosion-Proof) · `SVP-DRV-GBX` Gearbox / Speed Reducer ·
`SVP-DRV-CH1` Return Chain (Left) · `SVP-DRV-CH2` Return Chain (Right) ·
`SVP-DRV-SPK` Sprocket Set · `SVP-DRV-PUL` **Puller Assembly** ·
`SVP-DRV-SHF` **Drive Shaft** · `SVP-DRV-EP1` Drive End Plate (Upstream) ·
`SVP-DRV-EP2` Drive End Plate (Downstream) · `SVP-DRV-COV` Drive Cover

> **What this drive actually holds is the poppet valve actuator shaft**, and that is the
> point of it. The **Puller Assembly**, carried on the chains, takes the **Guide Block**
> and walks the piston upstream; because it is pulling on the actuator shaft — the
> Upstream Shaft `54004` — the same pull holds the **Poppet open**, so the return barely
> disturbs the line. At the upstream end the Puller lets go, the **Piston Spring**
> (`54009`) shuts the Poppet, and the flow itself launches the piston.
>
> The piston is never latched to the chain and never unlatched from it. If the actuator
> shaft fails or comes adrift the Poppet simply stays open and the line keeps flowing —
> that is the fail-safe the manual advertises. Model 85 is chain-driven; later SVPs use
> drive belts.

### System 8 · `instruments` — Instrumentation (7)

`SVP-INS-RTD1` Prover RTD (`PROVER T` · RTD1) · `SVP-INS-RTD2` Switch Bar RTD (`SHAFT TE` · RTD2) ·
`SVP-INS-PT01` Prover Pressure Transmitter (`PIT-01`) · `SVP-INS-TW1` Prover Thermowell ·
`SVP-INS-CTL` SVP Controller Enclosure · `SVP-INS-JB` Junction Box ·
`SVP-INS-CCB` Customer Connection Box (terminals 12–17)

> On the Customer Connection Box, say plainly: only **two** signals cross from the SVP to the
> SFC332P flow computer — **Run Permissive** and **Volume Pulse**. The WinSFC laptop connects to
> the flow computer, never to the prover.

### System 9 · `piping` — Process Connections (6)

`SVP-PIP-IN` Inlet Nozzle (10" 600#) · `SVP-PIP-OUT` Outlet Nozzle (10" 600#) ·
`SVP-PIP-INF` Inlet Flange · `SVP-PIP-OUF` Outlet Flange ·
`SVP-PIP-DRN` Drain Valve · `SVP-PIP-VNT` Vent Valve

> Radial nozzles hanging under the body, per §4.8 — **not** axial runs into the ends of
> the flow tube. Both ends are closed around the piston's two shafts, and the published
> envelope leaves no room above or beside the tube. Say plainly in the content that the
> fluid enters below the upstream end, runs the length of the bore **through the open
> Poppet inside the Piston**, and leaves below the downstream end.

### System 10 · `structure` — Structure (5)

`SVP-STR-BASE` Base Skid · `SVP-STR-SUP1` Flow Tube Support (Upstream) ·
`SVP-STR-SUP2` Flow Tube Support (Downstream) · `SVP-STR-LIFT` Lifting Lugs ·
`SVP-STR-NP` Nameplate (SVP-PR-8 · PR85-003 · SV085SE3)

**Total 93 pieces**, enumerated by name above. Show the count in the header, Human Atlas style.

### Explode vectors

Derive them systematically — do not hand-author 93 vectors:
- Axial parts (flanges, stops, retainers, shafts) explode along ±X, away from origin.
- Parts inside the bore explode +Y, staggered so they do not collide.
- Seals, rings and washers explode radially outward in the YZ plane at their own X.
- Guide block, drive and detection explode −Z, away from the flow tube.
- Process connections are radial, so they explode radially outward, furthest of all.
- Base skid explodes −Y.
- Explode distance scales with the part's depth in its assembly: outer parts move least, innermost
  parts move most. This produces the layered peel that makes an exploded view readable.

---

## 6. Content — bilingual, per part

Every part needs four fields:

```ts
{ nameEn, nameAr, functionAr, failureAr }
```

**Language rule:** technical terms, part names, field names and unit symbols stay in **English
exactly as written above**. Explanatory prose is **Modern Standard Arabic**. Never translate
`Poppet`, `Detector`, `Displacer`, `Flow Tube`, `Switch Bar`, `Guide Block`, `Flag`, `Prover`,
`Cam Follower`, `Igus Bushing`, `Belleville Spring`, `Meter Factor`, `Pre-Travel`.

Panels are RTL (`dir="rtl"` on the UI shell). The 3D canvas stays LTR.

Sample of the required depth:

```ts
'SVP-GDB-24005': {
  nameEn: 'Flag',
  nameAr: 'الـ Flag — الشفرة الحاجبة',
  functionAr: 'شفرة رقيقة مثبتة على الـ Guide Block. عند مرورها بين طرفَي الـ Optical Volume Switch تقطع الشعاع الضوئي فتُولَّد الإشارة. وهنا نقطة جوهرية: الـ Detectors لا ترى الـ Piston إطلاقاً، بل ترى هذه الشفرة وحدها. فدقة القياس كلها تعتمد على ثبات موضع الـ Flag بالنسبة إلى الـ Piston.',
  failureAr: 'انحناء الشفرة أو ارتخاء براغي تثبيتها يزيح لحظة الإشارة، فيتغير الحجم المقيس ويظهر الأثر انحرافاً في الـ Meter Factor. أما اتساخها أو اتساخ عدسة الـ Detector فيؤدي إلى إشارة ضعيفة أو مفقودة، ومنها تنشأ رسائل العطل sensor stuck و sensor out of sequence.',
}
```

Write entries of this quality for all ~93 parts. For repetitive fasteners a shorter entry is fine,
but every part must have all four fields — no placeholders, no "TODO".

---

## 7. UI — modelled on Human Atlas

```
┌──────────────────────────────────────────────────────────────────────┐
│ ● INTERACTIVE PROVER                        [🔍 Find a component]  ⓘ │
│ SVP Atlas  [3D]                                                      │
│ 93 modeled pieces · Honeywell Enraf Calibron · SVP-PR-8              │
│                                                                      │
│ ┌────────────────┐                              ┌──────────────────┐ │
│ │ Systems    10  │                              │ Piston Assembly  │ │
│ │ [All][Body][…] │                              │                  │ │
│ │ ● Flow Tube  6◉│         3D VIEWPORT          │ Poppet           │ │
│ │ ● Piston    15◉│                              │ صمام الـ Poppet  │ │
│ │ ● Upstream  15◉│                              │                  │ │
│ │ ● Downstrm  12◉│                              │ [Arabic function]│ │
│ │ ● GuideBlk  12◉│                              │ [Arabic failure] │ │
│ │ ● Detection  5◉│                              │                  │ │
│ │ ● Drive     10◉│                              │ OEM Item   Qty   │ │
│ │ ● Instrum    7◉│                              │ 54003      1     │ │
│ │ ● Connect    6◉│                              │                  │ │
│ │ ● Structure  5◉│                              │ [Isolate part >] │ │
│ │ 93 visible  Hide all                          │  Clear selection │ │
│ └────────────────┘                              └──────────────────┘ │
│                    ─── SEPARATED COMPONENTS ───                      │
│              ┌────────────────────────────────────┐                  │
│              │ Explode assembly        32 %   ↺   │                  │
│              │ ●────────────────────────          │                  │
│              │ Assembled            Every piece   │                  │
│              └────────────────────────────────────┘                  │
│ Drag to orbit · Pinch to zoom · Tap to inspect       Source & credits │
└──────────────────────────────────────────────────────────────────────┘
```

Right edge, vertical: `¾` `F` `S` `T` view buttons, plus reset-camera and reset-all icons.

| Element | Behaviour |
|---|---|
| Search | Live filter across `nameEn`, `nameAr`, `oem`. Selecting a result selects and frames that part. Typing `54003` must find the Poppet. |
| System row | Toggles visibility. Coloured dot matches the system colour in 3D. Live piece count. |
| Tap a part | Info card opens. Part gets an emissive highlight. |
| Isolate part | Selected part at full opacity, everything else at `0.05`. Camera frames it. |
| Explode slider | 0–100 %, `basePos → basePos + dir·dist·t`. Fully reversible with no drift. |
| Cutaway | Toggle. Clips the near half of the flow tube (`clippingPlanes`, normal `[0,0,1]`) so the piston is visible inside. |
| Labels | Above 5 % explode, thin leader lines to floating labels showing OEM number + English name. |

---

## 8. Mechanism animation — "what happens inside"

A **visual** simulation. No physics solver, no CFD. A timeline that drives transforms.

```
IDLE            piston parked downstream · poppet OPEN · fluid enters the bottom inlet
                nozzle, runs the bore THROUGH the open poppet, leaves the bottom outlet
RETURN          motor turns · chains move · PULLER takes the guide block · guide block
                travels upstream · piston pulled with it · the pull on the poppet
                actuator shaft is what HOLDS THE POPPET OPEN — flow barely disturbed
ARMED           guide block at launch position · puller still holding the actuator shaft
LAUNCH          the PULLER RELEASES THE POPPET ACTUATOR SHAFT · the Piston Spring
                closes the poppet · the piston becomes a moving seal and the flow
                itself drives it downstream
PRE_TRAVEL      piston accelerates to fluid velocity — "synchronisation"
DETECTOR_1      Flag passes Detector 1 → lamp 1 flashes green → measurement starts
MEASURING       piston sweeps the calibrated volume · pulse counter runs
DETECTOR_2      Flag passes Detector 2 → lamp 2 flashes green → measurement ends
STOPPED         piston shaft hits the mechanical stop
POPPET_REOPEN   line pressure pushes the piston perimeter downstream · poppet opens ·
                flow resumes with no surge
COMPLETE        → RETURN for the next pass, or → RESULT after the last pass
```

Requirements:
- The **Flag** is what visibly crosses the detectors — not the piston. Make this unmistakable.
  Auto-zoom to the detector when `DETECTOR_1` fires if the close-up view is active.
- The **poppet** must visibly open and close at the right moments. This is the single most
  misunderstood part of an SVP; the animation is the explanation. Show it correctly: the
  drive only ever **holds the poppet open**, and `LAUNCH` is a *release*, not a latch
  popping. Nothing pushes the piston downstream — the flow does.
- The **chains, puller and guide block** move during `RETURN` and are stationary during
  `MEASURING`. The Puller must visibly **let go** at `LAUNCH` and then sit still while the
  piston runs away from it downstream. If the viewer cannot see the puller release, the
  animation has failed at its main job.
- Controls: `Play` · `Pause` · `Step` (advance exactly one state) · speed `0.25× / 1× / 4×`.
- A state ribbon under the viewport highlights the current state and lets the user jump to any
  state directly. Jumping sets all transforms to that state's pose instantly.
- Two detector lamps: dark → flash bright green on trigger → stay lit for the rest of the pass.
- Fluid: instanced particles along the flow path. They enter at the **bottom inlet nozzle**
  and leave at the **bottom outlet nozzle** — never through the ends of the tube. During
  `MEASURING` they move *with* the piston (no bypass). During `IDLE`, `RETURN` and
  `POPPET_REOPEN` they stream *through* the open poppet, along the axis of the bore.

---

## 9. Numeric readout — build last, keep small

One compact card after a completed run:

```
Passes            5
Meter Factor      0.9950
Actual K Factor   60301.51 pulses/m³
Repeatability     0.043 %   (limit 0.200 %)
Status            PASS
```

```ts
MF = correctedProverVolume / correctedMeterVolume;
actualK = nominalK / MF;
repeatabilityPct = ((maxMF - minMF) / minMF) * 100;
```

Seed the defaults so a default run lands on `MF = 0.9950` and `repeatability = 0.043 %` — real
figures from prover SVP-PR-8 (`F = 0.27601 m³`, `L = 0.27739 m³`, nominal K = 60 000 pulses/m³).

Add one line under the card: *Simplified — not certified for custody transfer.*
Do **not** build a corrections engine, a Water Draw module, or editable API coefficients. If §0
priorities 1–4 are complete and context remains, those belong in a later session.

---

## 10. Visual design

```
background   #0d1117      flow tube    #8b95a5   piston body  #c9a227
poppet       #d4622a      seals/rings  #2f3640   shafts       #b8bfc9
guide block  #7c5cff      flag         #ffd166   detectors    #e5484d → #3fb950 triggered
switch bar   #6b7280      drive        #4b5563   instruments  #58a6ff
piping       #7d8590      structure    #30363d   fluid        #2f81f7 @ 0.7
accent       #d29922
```

Each system gets its own dot colour in the Systems panel, matching its parts in 3D.

Typography: `IBM Plex Sans` (UI), `IBM Plex Mono` (all numbers and OEM item numbers),
`IBM Plex Sans Arabic` (Arabic prose).

Lighting: directional with shadows from `[5,8,5]`, fill from `[-5,3,-5]`, ambient 0.35.

Performance target: 60 fps on iPad Pro with all 93 parts visible. Use `InstancedMesh` for every
bolt, ring and washer set. Share materials across parts of the same colour.

---

## 11. Build phases

**A — Skeleton.** Vite + React + TS + Tailwind + R3F. One cylinder renders. Touch orbit works at a
tablet viewport. Stop and verify.

**B — Primitives.** All ten builders in `three/primitives/`, each demoed once. Stop and verify.

**C — The atlas.** Full `parts.ts` (~93 rows) + `Assembly.tsx`. Everything renders in the right
place. Verify the piston sits inside the bore, the flag sits between the detectors, the guide block
rides the guide bars. **This is the milestone that matters most — do not rush past it.**

**D — Interaction.** Tap-select, hover, isolate, systems toggles, search, explode slider, cutaway,
view cube, labels. Explode must return to exact original transforms.

**E — Content.** All ~93 bilingual entries wired into the info card. RTL layout.

**F — Mechanism.** The animation of §8, state ribbon, detector lamps, fluid particles.

**G — Readout.** §9. Only after A–F are complete.

---

## 12. Footer disclaimer — permanent, bilingual

> Educational model. Geometry is dimensionally proportioned from published Model 85 data and the
> live SVP-PR-8 configuration; it is not a manufacturer CAD model. Refer to the Honeywell Enraf
> manuals and API MPMS Chapters 4 and 12 for authoritative procedures.

> نموذج تعليمي. الأبعاد مبنية على بيانات Model 85 المنشورة وعلى إعدادات SVP-PR-8 الفعلية، وهو ليس
> نموذج CAD صادراً عن الشركة المصنّعة. يُرجع في الإجراءات المعتمدة إلى أدلة Honeywell Enraf
> ومعايير API MPMS الفصلين 4 و 12.

Do not embed any scanned figure from the manuals in the application.

---

## 13. Definition of done

- [ ] `npm run dev` runs clean
- [ ] ~93 parts render, each individually selectable, each showing its OEM number and bilingual content
- [ ] Systems panel toggles all ten groups with live counts
- [ ] Search finds a part by English name, Arabic name, or OEM number
- [ ] Explode 0→100→0 is smooth and returns to exact original positions
- [ ] Cutaway reveals the piston inside the flow tube
- [ ] Isolate works on any part
- [ ] Full mechanism animation runs, and the **Flag** is visibly what crosses the detectors
- [ ] The poppet visibly closes at `LAUNCH` and reopens at `POPPET_REOPEN`
- [ ] Fluid enters and leaves through the **bottom nozzles**, never through the ends of the tube
- [ ] The **Puller** visibly releases the poppet actuator shaft at `LAUNCH`, and the flow —
      not the drive — is what carries the piston downstream
- [ ] Works with touch at a 1024×1366 viewport
- [ ] No browser storage API anywhere in the codebase

---

## 14. Sources for §4.8 and the return mechanism

The two corrections in §4.8 and §5 system 7 were researched rather than assumed. What each
source actually establishes:

| Source | What it establishes |
|---|---|
| **SVP-PR-8 parts list** (doc 44103445 Rev 0), items `52102`/`52104`, `53102`/`53104`, `54004`, `54005` | Both ends of the flow tube are closed around a moving shaft. No axial process connection is possible. |
| **Manual doc 44103445 Rev 0, Figure 1** — overall 5230 × 1270 × 1230, centreline 762 | With a 820.78 OD tube, there is no room for a top or side nozzle. Only the 352 mm under the tube will take one. |
| **Honeywell Enraf SVP Installation, Operation & Service Manual, models 035–120** | "the piston assembly is moved to the upstream end of the flow tube by a mechanical drive driven by an explosion-proof electric motor"; "When upstream position has been reached, **the poppet valve actuator shaft is released by the return mechanism**, allowing the poppet valve to close and the flowing fluid to move the piston through the measurement cylinder"; the fail-safe if "the poppet actuator shaft becomes disconnected or otherwise fails"; "The poppet valve is coaxially mounted within the free moving piston." |
| **Calibron SVP Service Manual, models 35 / 85 / 120** | Major components are "prover body, prover frame, piston assembly, optic switches, **puller assembly**, drive system, **drive shaft**, and controller". Figure 15 is the guideblock and puller for the S85/S120; the S85 puller carries cam followers, the S35 puller does not. The puller sits on the front side of the guide block. ¾" chain play, adjustment blocks, a plastic rail holding the chain level with the sprocket tops, sprocket spacing fixed by the size of the puller. |
| **US 8,511,138 B2** — Piston prover apparatus (Honeywell; Larsen, Krafthefer) | "An inlet port and an outlet port can be located at the bottom of the cylindrical object." |
| **US 8,950,235 B2** — Self-flushing SVP (Honeywell; Heath) | Outlet "welded at the bottom of the cylindrical object so that the foreign material can flow directly out". The bottom outlet is deliberate, so the bore self-flushes. |
| **US 10,830,632** — Sealing arrangement of a poppet valve in a prover | The poppet is held by a spring against its support; later SVPs use drive belts where Model 85 uses chains. |
| **API MPMS Ch. 4.3** (small volume provers), 4.2, 4.6 | SVPs pass fewer than 10 000 whole pulses and need double-chronometry pulse interpolation. "Optical detector switches used with these provers are externally mounted from the flow media" — the detectors sit outside the pressure boundary, which is why they see the **Flag** and never the piston. |

**Explicitly excluded.** `US 5,392,632` "Small volume prover" is assigned to **Oval Engineering
Co., Ltd.**, not Calibron. It describes an outer housing with a coaxial measuring conduit,
radial port sets and upstream/downstream **annular passages** — a different machine. Its
"annular bypass" language must not be imported into this model: on the Calibron/Honeywell SVP
the fluid passes **through the piston's own poppet**, not around it.

**Where doubt remains.** That the ports point *downward* is forced by the published envelope
and confirmed by the two Honeywell patents; but those patents post-date Model 85 and claim
improvements, so the manuals' own drawing should be checked on site if it can be. The axial
station of each nozzle is `[EST]`, bounded only by the rule that a port may not open into the
piston's swept path. Site piping beyond the connection flanges is not modelled at all.
