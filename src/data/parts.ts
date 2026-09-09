/**
 * THE PART TABLE — SPEC.md §5. 91 rows, enumerated by name in the spec.
 *
 * This file is the product. Everything else in `src/three/` is a way of drawing it:
 * `Assembly.tsx` maps over `PARTS` and hands each row to one of the ten primitive
 * builders (SPEC.md §4.1). **Adding a part means adding a row here, never writing a
 * component** (SPEC.md §1.3).
 *
 * Rules this file lives under:
 *   - Part `id`s are frozen once written (SPEC.md §1.4). Never rename one.
 *   - `oem` numbers are the real Calibron item numbers from the maintenance chapter
 *     of doc 44103445 Rev 0. They are what makes this authentic — display them.
 *   - Every dimension here is in **millimetres** (SPEC.md §1.5). The primitives
 *     convert at the render boundary; nothing in `src/three/` re-scales.
 *   - Explode vectors are **derived**, not hand-authored (SPEC.md §5). A row states
 *     where the part sits; `deriveExplode` decides where it flies to.
 *
 * Coordinate system (SPEC.md §4.3): origin is the centre of the flow tube bore at
 * the axial midpoint of the calibrated section. **+X is the direction of flow**,
 * +Y is up, +Z is toward the viewer, and the drive assembly sits at −Z.
 *
 * Dimensions marked [EST] in SPEC.md §4.7 are proportional estimates: they drive how
 * the model *looks*, never what it *measures*. The measured figures — bore, stroke,
 * detector positions — come from `geometry.ts` and are used verbatim.
 *
 * A note on `instance` for anyone adding rows: the repetition offsets are applied
 * *inside* the row's own rotated group, so `instance.axis` is read in the row's
 * local frame. If a row carries a `rotation`, pick the local axis that lands on the
 * world axis you want.
 */
import { AXIAL, EST, FLOW_TUBE, OVERALL } from './geometry';
import { PALETTE } from './theme';
import type { InstanceSpec, PrimitiveId } from '../three/primitives/types';

/* ------------------------------------------------------------------ systems */

export type SystemId =
  | 'flowtube'
  | 'piston'
  | 'upstream'
  | 'downstream'
  | 'guideblock'
  | 'detection'
  | 'drive'
  | 'instruments'
  | 'piping'
  | 'structure';

export interface System {
  id: SystemId;
  /** English name exactly as SPEC.md §5 writes it. */
  nameEn: string;
  /** Dot colour in the Systems panel, matching this system in 3D (SPEC.md §10). */
  color: string;
  /** The count SPEC.md §5 declares for this system. Checked against the rows below. */
  declared: number;
}

export const SYSTEMS: System[] = [
  { id: 'flowtube', nameEn: 'Flow Tube & Body', color: PALETTE.flowTube, declared: 6 },
  { id: 'piston', nameEn: 'Piston Assembly', color: PALETTE.pistonBody, declared: 15 },
  { id: 'upstream', nameEn: 'Upstream Seal Retainer & Flange', color: PALETTE.shafts, declared: 15 },
  { id: 'downstream', nameEn: 'Downstream Stop & Seal Retainer', color: PALETTE.switchBar, declared: 12 },
  { id: 'guideblock', nameEn: 'Guide Block & Flag', color: PALETTE.guideBlock, declared: 12 },
  { id: 'detection', nameEn: 'Detection', color: PALETTE.detector, declared: 5 },
  { id: 'drive', nameEn: 'Return Drive', color: PALETTE.drive, declared: 8 },
  { id: 'instruments', nameEn: 'Instrumentation', color: PALETTE.instruments, declared: 7 },
  { id: 'piping', nameEn: 'Process Piping', color: PALETTE.piping, declared: 6 },
  { id: 'structure', nameEn: 'Structure', color: PALETTE.structure, declared: 5 },
];

/* -------------------------------------------------------------------- types */

/** A row as authored. Explode vectors are added by `deriveExplode`. */
export interface PartSpec {
  id: string;
  oem: string | null;
  nameEn: string;
  system: SystemId;
  primitive: PrimitiveId;
  params: Record<string, number>;
  /** Assembled position, mm. */
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  qty?: number;
  instance?: InstanceSpec;
}

/** SPEC.md §4.2 — a row with its derived explode vector. */
export interface Part extends PartSpec {
  /** Unit vector. */
  explodeDir: [number, number, number];
  /** Millimetres travelled at 100 % explode. */
  explodeDist: number;
}

/* ------------------------------------------------------------------- layout */

/** Material roles. The Systems panel colours by system; the 3D model colours by
 *  what the part is made of, which is how SPEC.md §10 lists the palette. */
const STEEL = PALETTE.shafts;
const SEAL = PALETTE.seals; // elastomer, Teflon, Ryton, Igus — the dark polymers
const BODY = PALETTE.flowTube;
const PISTON = PALETTE.pistonBody;
const POPPET = PALETTE.poppet;
const GUIDE = PALETTE.guideBlock;
const FLAGC = PALETTE.flag;
const DET = PALETTE.detector;
const SWB = PALETTE.switchBar;
const DRV = PALETTE.drive;
const INS = PALETTE.instruments;
const PIP = PALETTE.piping;
const STR = PALETTE.structure;

/** Axial landmarks, mm. Derived from the verified figures in `geometry.ts`. */
const TUBE_HALF = FLOW_TUBE.length / 2; // 965
const FLANGE_X = TUBE_HALF + EST.flangeThk / 2; // outboard face of each flange
const SEAL_RETAINER_X = FLANGE_X + 90; // seal retainer stack, outboard of the flange
const SKID_Y = -OVERALL.centrelineHeight; // top of the base skid
const SKID_CY = SKID_Y - EST.baseThk / 2;

/**
 * The piston is drawn at the axial midpoint of the calibrated section, so the
 * **Flag** sits exactly between Detector 1 and Detector 2 — the arrangement the
 * whole application exists to teach. Phase F animates it away from here.
 */
const PISTON_X = 0;

/** Planes at −Z, from the [EST] figures in SPEC.md §4.7. */
const SWITCHBAR_Z = EST.switchBarZ; // −520, the switch bar and both detectors
const GUIDE_Z = EST.driveZ; // −600, the guide block and its bearing guide bars
const CHAIN_Z = EST.chainZ; // −640, the return drive
const DRIVE_Y = -300; // the drive runs below the switch bar, clear of the guide block

const HALF_PI = Math.PI / 2;

/* --------------------------------------------------------------- the 91 rows */

const SPECS: PartSpec[] = [
  /* ---- System 1 · flowtube — Flow Tube & Body (6) ------------------------ */
  {
    id: 'SVP-BOD-FT01',
    oem: null,
    nameEn: 'Flow Tube (Honed Measurement Cylinder)',
    system: 'flowtube',
    primitive: 'tube',
    // The one part whose dimensions are measured, not estimated: SPEC.md §4.5.
    params: {
      outerDiameter: FLOW_TUBE.outerDiameter,
      innerDiameter: FLOW_TUBE.innerDiameter,
      length: FLOW_TUBE.length,
      segments: 64,
    },
    position: [0, 0, 0],
    color: BODY,
  },
  {
    id: 'SVP-BOD-52201',
    oem: '52201',
    nameEn: 'Upstream Flange',
    system: 'flowtube',
    primitive: 'disc',
    params: { diameter: EST.flangeOD, thickness: EST.flangeThk, boreDiameter: 300 },
    position: [-FLANGE_X, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-BOD-52205',
    oem: '52205',
    nameEn: 'Upstream Flange O-Ring Seal',
    system: 'flowtube',
    primitive: 'ring',
    params: { diameter: 760, cordDiameter: 14 },
    position: [-TUBE_HALF + 4, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-BOD-53001',
    oem: '53001',
    nameEn: 'Downstream Flange',
    system: 'flowtube',
    primitive: 'disc',
    params: { diameter: EST.flangeOD, thickness: EST.flangeThk, boreDiameter: 300 },
    position: [FLANGE_X, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-BOD-53002',
    oem: '53002',
    nameEn: 'O-Ring Seal Downstream Flange',
    system: 'flowtube',
    primitive: 'ring',
    params: { diameter: 760, cordDiameter: 14 },
    position: [TUBE_HALF - 4, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-BOD-53003',
    oem: '53003',
    nameEn: 'Flange Retaining Bolt Set',
    system: 'flowtube',
    primitive: 'bolt',
    // 20 bolts on a 780 mm bolt circle: one row, one InstancedMesh (SPEC.md §4.2).
    params: {
      diameter: EST.boltDia,
      length: EST.boltLen,
      headDiameter: 40,
      headThickness: 18,
    },
    position: [FLANGE_X, 0, 0],
    qty: EST.flangeBolts,
    instance: { pattern: 'circle', radius: EST.flangeBoltCircle / 2, axis: 'x' },
    color: STEEL,
  },

  /* ---- System 2 · piston — Piston Assembly (15) -------------------------- */
  {
    id: 'SVP-PIS-54001',
    oem: '54001',
    nameEn: 'Piston Body',
    system: 'piston',
    primitive: 'tube',
    params: { outerDiameter: EST.pistonBodyDia, innerDiameter: 520, length: EST.pistonBodyLen },
    position: [PISTON_X, 0, 0],
    color: PISTON,
  },
  {
    id: 'SVP-PIS-54002',
    oem: '54002',
    nameEn: 'Piston Support',
    system: 'piston',
    primitive: 'disc',
    params: { diameter: 520, thickness: 40, boreDiameter: 90 },
    position: [PISTON_X + 70, 0, 0],
    color: PISTON,
  },
  {
    id: 'SVP-PIS-54003',
    oem: '54003',
    nameEn: 'Poppet',
    system: 'piston',
    primitive: 'cone',
    params: { diameter: EST.poppetDia, tipDiameter: 90, length: EST.poppetLen },
    position: [PISTON_X - 150, 0, 0],
    color: POPPET,
  },
  {
    id: 'SVP-PIS-54004',
    oem: '54004',
    nameEn: 'Upstream Shaft',
    system: 'piston',
    primitive: 'rod',
    // Carries the Guide Block, and therefore the Flag, out through the upstream end.
    params: { diameter: EST.shaftDia, length: EST.shaftLen },
    position: [PISTON_X - (EST.pistonBodyLen / 2 + EST.shaftLen / 2), 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54005',
    oem: '54005',
    nameEn: 'Downstream Shaft',
    system: 'piston',
    primitive: 'rod',
    params: { diameter: EST.shaftDia, length: EST.shaftLen },
    position: [PISTON_X + (EST.pistonBodyLen / 2 + EST.shaftLen / 2), 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54006',
    oem: '54006',
    nameEn: 'Belleville Retainer Washer',
    system: 'piston',
    primitive: 'disc',
    params: { diameter: 150, thickness: 12, boreDiameter: 74 },
    position: [PISTON_X + 130, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54008',
    oem: '54008',
    nameEn: 'Piston Seal Rider',
    system: 'piston',
    primitive: 'ring',
    params: { diameter: 660, cordDiameter: 18 },
    position: [PISTON_X - 90, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-PIS-54009',
    oem: '54009',
    nameEn: 'Piston Spring',
    system: 'piston',
    primitive: 'helix',
    // Holds the Poppet closed once the piston launches (SPEC.md §8, LAUNCH).
    params: { diameter: 200, wireDiameter: 16, length: 180, turns: 7 },
    position: [PISTON_X - 60, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54010',
    oem: '54010',
    nameEn: 'Piston Belleville Spring',
    system: 'piston',
    primitive: 'cone',
    params: { diameter: 160, tipDiameter: 96, length: 12 },
    position: [PISTON_X + 150, 0, 0],
    qty: 6,
    instance: { pattern: 'linear', spacing: 14, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54011',
    oem: '54011',
    nameEn: 'Igus Bushing',
    system: 'piston',
    primitive: 'tube',
    params: { outerDiameter: 110, innerDiameter: 74, length: 70 },
    position: [PISTON_X - 230, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-PIS-54013',
    oem: '54013',
    nameEn: 'Piston Seal',
    system: 'piston',
    primitive: 'ring',
    params: { diameter: 668, cordDiameter: 16 },
    position: [PISTON_X + 60, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-PIS-54014',
    oem: '54014',
    nameEn: 'Poppet Seal',
    system: 'piston',
    primitive: 'ring',
    params: { diameter: 290, cordDiameter: 12 },
    position: [PISTON_X - 110, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-PIS-54017',
    oem: '54017',
    nameEn: 'Belleville Retainer Seal',
    system: 'piston',
    primitive: 'ring',
    params: { diameter: 150, cordDiameter: 8 },
    position: [PISTON_X + 172, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-PIS-54018',
    oem: '54018',
    nameEn: 'Socket Head Cap Screw',
    system: 'piston',
    primitive: 'bolt',
    params: { diameter: 12, length: 45, headDiameter: 20, headThickness: 12, headStyle: 1 },
    position: [PISTON_X + 110, 0, 0],
    qty: 8,
    instance: { pattern: 'circle', radius: 120, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-PIS-54020',
    oem: '54020',
    nameEn: 'Hex Head Bolt',
    system: 'piston',
    primitive: 'bolt',
    params: { diameter: 16, length: 60, headDiameter: 26, headThickness: 14 },
    position: [PISTON_X - 120, 0, 0],
    qty: 6,
    instance: { pattern: 'circle', radius: 200, axis: 'x' },
    color: STEEL,
  },

  /* ---- System 3 · upstream — Upstream Seal Retainer & Flange (15) -------- */
  {
    id: 'SVP-UPS-52101',
    oem: '52101',
    nameEn: 'Upstream Seal Retainer',
    system: 'upstream',
    primitive: 'tube',
    params: { outerDiameter: 300, innerDiameter: 90, length: 180 },
    position: [-SEAL_RETAINER_X, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52102',
    oem: '52102',
    nameEn: 'Shaft Seal Upstream Outer',
    system: 'upstream',
    primitive: 'ring',
    params: { diameter: 100, cordDiameter: 12 },
    position: [-1185, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52103',
    oem: '52103',
    nameEn: 'Igus Bushing',
    system: 'upstream',
    primitive: 'tube',
    params: { outerDiameter: 112, innerDiameter: 74, length: 60 },
    position: [-1140, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52104',
    oem: '52104',
    nameEn: 'Shaft Seal',
    system: 'upstream',
    primitive: 'ring',
    params: { diameter: 96, cordDiameter: 10 },
    position: [-1120, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52106',
    oem: '52106',
    nameEn: 'Retaining Ring',
    system: 'upstream',
    primitive: 'ring',
    params: { diameter: 130, cordDiameter: 8 },
    position: [-1205, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52107',
    oem: '52107',
    nameEn: 'Socket Head Cap Screw',
    system: 'upstream',
    primitive: 'bolt',
    params: { diameter: 12, length: 45, headDiameter: 20, headThickness: 12, headStyle: 1 },
    position: [-1195, 0, 0],
    qty: 8,
    instance: { pattern: 'circle', radius: 120, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52108',
    oem: '52108',
    nameEn: 'Shock Absorber',
    system: 'upstream',
    primitive: 'probe',
    // Laid along the axis: local +Y → world +X, so the pair repeats along local Z,
    // which the rotation leaves pointing at world Z.
    params: { diameter: 90, length: 200, stemDiameter: 40, stemLength: 120 },
    position: [-1300, 0, 0],
    rotation: [0, 0, -HALF_PI],
    qty: 2,
    instance: { pattern: 'linear', spacing: 440, axis: 'z' },
    color: DRV,
  },
  {
    id: 'SVP-UPS-52109',
    oem: '52109',
    nameEn: 'Teflon O-Ring Seal',
    system: 'upstream',
    primitive: 'ring',
    params: { diameter: 110, cordDiameter: 8 },
    position: [-1160, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52110',
    oem: '52110',
    nameEn: 'Ryton Washer',
    system: 'upstream',
    primitive: 'disc',
    params: { diameter: 130, thickness: 8, boreDiameter: 76 },
    position: [-1150, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52112',
    oem: '52112',
    nameEn: 'Notched Ryton Washer',
    system: 'upstream',
    primitive: 'disc',
    params: { diameter: 130, thickness: 8, boreDiameter: 76 },
    position: [-1215, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-UPS-52202',
    oem: '52202',
    nameEn: 'Belleville Spring',
    system: 'upstream',
    primitive: 'cone',
    params: { diameter: 150, tipDiameter: 90, length: 12 },
    position: [-1245, 0, 0],
    qty: 6,
    instance: { pattern: 'linear', spacing: 14, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52203',
    oem: '52203',
    nameEn: 'Washer Belleville Retainer',
    system: 'upstream',
    primitive: 'disc',
    params: { diameter: 160, thickness: 14, boreDiameter: 76 },
    position: [-1262, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52204',
    oem: '52204',
    nameEn: 'Retaining Ring',
    system: 'upstream',
    primitive: 'ring',
    params: { diameter: 150, cordDiameter: 8 },
    position: [-1274, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52206',
    oem: '52206',
    nameEn: 'Socket Head Cap Screw',
    system: 'upstream',
    primitive: 'bolt',
    params: { diameter: 10, length: 40, headDiameter: 17, headThickness: 10, headStyle: 1 },
    position: [-1282, 0, 0],
    qty: 6,
    instance: { pattern: 'circle', radius: 95, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-UPS-52207',
    oem: '52207',
    nameEn: 'Hex Head Cap Screw',
    system: 'upstream',
    primitive: 'bolt',
    params: { diameter: 14, length: 55, headDiameter: 24, headThickness: 13 },
    position: [-1290, 0, 0],
    qty: 6,
    instance: { pattern: 'circle', radius: 160, axis: 'x' },
    color: STEEL,
  },

  /* ---- System 4 · downstream — Downstream Stop & Seal Retainer (12) ------ */
  {
    id: 'SVP-DWN-53101',
    oem: '53101',
    nameEn: 'Downstream Stop',
    system: 'downstream',
    primitive: 'disc',
    // What the piston shaft strikes at the end of the pass — SPEC.md §8, STOPPED.
    params: { diameter: 260, thickness: 60, boreDiameter: 76 },
    position: [1215, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-DWN-53102',
    oem: '53102',
    nameEn: 'Shaft Seal',
    system: 'downstream',
    primitive: 'ring',
    params: { diameter: 96, cordDiameter: 10 },
    position: [1120, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53103',
    oem: '53103',
    nameEn: 'Igus Bushing',
    system: 'downstream',
    primitive: 'tube',
    params: { outerDiameter: 112, innerDiameter: 74, length: 60 },
    position: [1140, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53104',
    oem: '53104',
    nameEn: 'Shaft Seal',
    system: 'downstream',
    primitive: 'ring',
    params: { diameter: 100, cordDiameter: 12 },
    position: [1185, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53105',
    oem: '53105',
    nameEn: 'Notched Ryton Washer',
    system: 'downstream',
    primitive: 'disc',
    params: { diameter: 130, thickness: 8, boreDiameter: 76 },
    position: [1170, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53106',
    oem: '53106',
    nameEn: 'Retaining Ring',
    system: 'downstream',
    primitive: 'ring',
    params: { diameter: 130, cordDiameter: 8 },
    position: [1200, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-DWN-53107',
    oem: '53107',
    nameEn: 'Downstream Stop Retaining Bolt',
    system: 'downstream',
    primitive: 'bolt',
    params: { diameter: 16, length: 70, headDiameter: 26, headThickness: 14 },
    position: [1245, 0, 0],
    qty: 6,
    instance: { pattern: 'circle', radius: 100, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-DWN-53108',
    oem: '53108',
    nameEn: 'O-Ring Seal Downstream Stop',
    system: 'downstream',
    primitive: 'ring',
    params: { diameter: 250, cordDiameter: 10 },
    position: [1185, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53109',
    oem: '53109',
    nameEn: 'Downstream Seal Retainer',
    system: 'downstream',
    primitive: 'tube',
    params: { outerDiameter: 300, innerDiameter: 90, length: 180 },
    position: [SEAL_RETAINER_X, 0, 0],
    color: STEEL,
  },
  {
    id: 'SVP-DWN-53110',
    oem: '53110',
    nameEn: 'Downstream Seal Retainer Bolt',
    system: 'downstream',
    primitive: 'bolt',
    params: { diameter: 12, length: 45, headDiameter: 20, headThickness: 12 },
    position: [1195, 0, 0],
    qty: 8,
    instance: { pattern: 'circle', radius: 120, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-DWN-53111',
    oem: '53111',
    nameEn: 'O-Ring Seal',
    system: 'downstream',
    primitive: 'ring',
    params: { diameter: 290, cordDiameter: 10 },
    position: [1060, 0, 0],
    color: SEAL,
  },
  {
    id: 'SVP-DWN-53112',
    oem: '53112',
    nameEn: 'Ryton Washer',
    system: 'downstream',
    primitive: 'disc',
    params: { diameter: 130, thickness: 8, boreDiameter: 76 },
    position: [1155, 0, 0],
    color: SEAL,
  },

  /* ---- System 5 · guideblock — Guide Block & Flag (12) ------------------- */
  /* The key to the machine. The Detectors never see the Piston; they see the Flag
     on this block, which rides the Bearing Guide Bars on its Cam Followers. */
  {
    id: 'SVP-GDB-24001',
    oem: '24001',
    nameEn: 'Guide Block',
    system: 'guideblock',
    primitive: 'box',
    params: { width: EST.guideBlockW, height: EST.guideBlockH, depth: EST.guideBlockD },
    position: [PISTON_X, 0, GUIDE_Z],
    color: GUIDE,
  },
  {
    id: 'SVP-GDB-24002',
    oem: '24002',
    nameEn: 'Cam Follower',
    system: 'guideblock',
    primitive: 'probe',
    // Roller on its stud. Rotated so the axle lies along +Z, across the bar.
    params: { diameter: 70, length: 40, stemDiameter: 24, stemLength: 60 },
    position: [PISTON_X, 100, GUIDE_Z],
    rotation: [HALF_PI, 0, 0],
    qty: 2,
    instance: { pattern: 'linear', spacing: 160, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24003',
    oem: '24003',
    nameEn: 'Bearing Guide Bar',
    system: 'guideblock',
    primitive: 'rod',
    params: { diameter: EST.guideBarDia, length: EST.guideBarLen },
    position: [0, 0, GUIDE_Z],
    qty: 2,
    instance: { pattern: 'linear', spacing: 200, axis: 'y' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24004',
    oem: '24004',
    nameEn: 'Bearing Guide Bar Shim',
    system: 'guideblock',
    primitive: 'box',
    params: { width: 60, height: 12, depth: 120 },
    position: [-EST.guideBarLen / 2 + 30, 0, GUIDE_Z],
    qty: 2,
    instance: { pattern: 'linear', spacing: 200, axis: 'y' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24005',
    oem: '24005',
    nameEn: 'Flag',
    system: 'guideblock',
    // Thin along X — the direction of travel — so it cuts the beam sharply. This
    // blade, not the piston, is what the Optical Volume Switches see.
    primitive: 'box',
    params: { width: EST.flagW, height: EST.flagH, depth: EST.flagLen },
    position: [PISTON_X, 150, GUIDE_Z + EST.flagLen / 2],
    color: FLAGC,
  },
  {
    id: 'SVP-GDB-24008',
    oem: '24008',
    nameEn: 'Motor Stop Ramp',
    system: 'guideblock',
    primitive: 'box',
    params: { width: 180, height: 40, depth: 60 },
    position: [PISTON_X - 170, 90, GUIDE_Z],
    color: GUIDE,
  },
  {
    id: 'SVP-GDB-24009',
    oem: '24009',
    nameEn: 'Socket Head Cap Screw',
    system: 'guideblock',
    primitive: 'bolt',
    // Rotated to drive along −Z into the block; the circle is taken about the
    // local X axis, which that rotation lands on the world XY plane.
    params: { diameter: 10, length: 40, headDiameter: 17, headThickness: 10, headStyle: 1 },
    position: [PISTON_X, 0, GUIDE_Z - EST.guideBlockD / 2],
    rotation: [0, HALF_PI, 0],
    qty: 4,
    instance: { pattern: 'circle', radius: 80, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24010',
    oem: '24010',
    nameEn: 'Lock Washer',
    system: 'guideblock',
    primitive: 'ring',
    params: { diameter: 22, cordDiameter: 4 },
    position: [PISTON_X, 0, GUIDE_Z - EST.guideBlockD / 2 - 12],
    rotation: [0, HALF_PI, 0],
    qty: 4,
    instance: { pattern: 'circle', radius: 80, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24011',
    oem: '24011',
    nameEn: 'Ground Strap',
    system: 'guideblock',
    primitive: 'box',
    params: { width: 220, height: 6, depth: 30 },
    position: [PISTON_X + 140, -90, GUIDE_Z],
    color: PALETTE.accent,
  },
  {
    id: 'SVP-GDB-24012',
    oem: '24012',
    nameEn: 'Socket Head Cap Screw',
    system: 'guideblock',
    primitive: 'bolt',
    params: { diameter: 8, length: 32, headDiameter: 14, headThickness: 8, headStyle: 1 },
    position: [PISTON_X - 170, 118, GUIDE_Z],
    rotation: [0, 0, HALF_PI],
    qty: 2,
    instance: { pattern: 'linear', spacing: 120, axis: 'z' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24018',
    oem: '24018',
    nameEn: 'Socket Head Cap Screw',
    system: 'guideblock',
    primitive: 'bolt',
    params: { diameter: 10, length: 40, headDiameter: 17, headThickness: 10, headStyle: 1 },
    position: [PISTON_X, -EST.guideBlockH / 2 - 20, GUIDE_Z],
    rotation: [0, 0, HALF_PI],
    qty: 4,
    instance: { pattern: 'linear', spacing: 60, axis: 'x' },
    color: STEEL,
  },
  {
    id: 'SVP-GDB-24019',
    oem: '24019',
    nameEn: 'Cam Follower',
    system: 'guideblock',
    primitive: 'probe',
    params: { diameter: 70, length: 40, stemDiameter: 24, stemLength: 60 },
    position: [PISTON_X, -100, GUIDE_Z],
    rotation: [HALF_PI, 0, 0],
    qty: 2,
    instance: { pattern: 'linear', spacing: 160, axis: 'x' },
    color: STEEL,
  },

  /* ---- System 6 · detection — Detection (5) ------------------------------ */
  {
    id: 'SVP-DET-01',
    oem: null,
    nameEn: 'Upstream Optical Volume Switch (Detector 1)',
    system: 'detection',
    // Positioned from the *measured* figure, not an estimate: AXIAL.detector1X.
    primitive: 'probe',
    params: { diameter: EST.detectorDia, length: EST.detectorLen, stemDiameter: 20, stemLength: 80 },
    position: [AXIAL.detector1X, 265, SWITCHBAR_Z],
    color: DET,
  },
  {
    id: 'SVP-DET-02',
    oem: null,
    nameEn: 'Downstream Optical Volume Switch (Detector 2)',
    system: 'detection',
    primitive: 'probe',
    params: { diameter: EST.detectorDia, length: EST.detectorLen, stemDiameter: 20, stemLength: 80 },
    position: [AXIAL.detector2X, 265, SWITCHBAR_Z],
    color: DET,
  },
  {
    id: 'SVP-DET-SB',
    oem: null,
    nameEn: 'Switch Bar',
    system: 'detection',
    primitive: 'box',
    params: { width: EST.switchBarLen, height: EST.switchBarH, depth: EST.switchBarW },
    position: [0, 360, SWITCHBAR_Z],
    color: SWB,
  },
  {
    id: 'SVP-DET-TW',
    oem: null,
    nameEn: 'Switch Bar Thermowell',
    system: 'detection',
    primitive: 'probe',
    params: { diameter: 34, length: 110, stemDiameter: 18, stemLength: 90 },
    position: [-600, 300, SWITCHBAR_Z],
    color: INS,
  },
  {
    id: 'SVP-DET-MS',
    oem: null,
    nameEn: 'Motor Stop Micro Switch',
    system: 'detection',
    // Tripped by the Motor Stop Ramp at the end of the return travel.
    primitive: 'box',
    params: { width: 90, height: 60, depth: 50 },
    position: [-860, 300, SWITCHBAR_Z],
    color: DET,
  },

  /* ---- System 7 · drive — Return Drive (8) ------------------------------- */
  {
    id: 'SVP-DRV-MOT',
    oem: null,
    nameEn: 'Return Drive Motor',
    system: 'drive',
    primitive: 'disc',
    params: { diameter: EST.motorDia, thickness: EST.motorLen },
    position: [EST.motorX, DRIVE_Y, CHAIN_Z],
    color: DRV,
  },
  {
    id: 'SVP-DRV-GBX',
    oem: null,
    nameEn: 'Gearbox / Speed Reducer',
    system: 'drive',
    primitive: 'box',
    params: { width: EST.gearboxW, height: EST.gearboxW, depth: 320 },
    position: [-1200, DRIVE_Y, CHAIN_Z],
    color: DRV,
  },
  {
    id: 'SVP-DRV-CH1',
    oem: null,
    nameEn: 'Return Chain (Left)',
    system: 'drive',
    // A closed racetrack around the two sprockets — `loop`, not a swept run.
    primitive: 'pipe',
    params: { bore: 0, wall: 18, length: 2400, rise: 160, loop: 1, segments: 72 },
    position: [-100, DRIVE_Y, CHAIN_Z - 60],
    color: STEEL,
  },
  {
    id: 'SVP-DRV-CH2',
    oem: null,
    nameEn: 'Return Chain (Right)',
    system: 'drive',
    primitive: 'pipe',
    params: { bore: 0, wall: 18, length: 2400, rise: 160, loop: 1, segments: 72 },
    position: [-100, DRIVE_Y, CHAIN_Z + 60],
    color: STEEL,
  },
  {
    id: 'SVP-DRV-SPK',
    oem: null,
    nameEn: 'Sprocket Set',
    system: 'drive',
    primitive: 'disc',
    // Rotated so each sprocket turns about +Z; the pair then repeats along local Z,
    // which that rotation lands on world X — one at each end of the chain loop.
    params: { diameter: 260, thickness: 40, boreDiameter: 44 },
    position: [-100, DRIVE_Y, CHAIN_Z],
    rotation: [0, HALF_PI, 0],
    qty: 2,
    instance: { pattern: 'linear', spacing: 2400, axis: 'z' },
    color: STEEL,
  },
  {
    id: 'SVP-DRV-EP1',
    oem: null,
    nameEn: 'Drive End Plate (Upstream)',
    system: 'drive',
    primitive: 'box',
    params: { width: 40, height: 520, depth: 420 },
    position: [-1330, DRIVE_Y, CHAIN_Z],
    color: DRV,
  },
  {
    id: 'SVP-DRV-EP2',
    oem: null,
    nameEn: 'Drive End Plate (Downstream)',
    system: 'drive',
    primitive: 'box',
    params: { width: 40, height: 520, depth: 420 },
    position: [1130, DRIVE_Y, CHAIN_Z],
    color: DRV,
  },
  {
    id: 'SVP-DRV-COV',
    oem: null,
    nameEn: 'Drive Cover',
    system: 'drive',
    primitive: 'box',
    params: { width: 2500, height: 20, depth: 400 },
    position: [-100, DRIVE_Y + 240, CHAIN_Z],
    color: DRV,
  },

  /* ---- System 8 · instruments — Instrumentation (7) ---------------------- */
  {
    id: 'SVP-INS-RTD1',
    oem: null,
    nameEn: 'Prover RTD (PROVER T · RTD1)',
    system: 'instruments',
    primitive: 'probe',
    params: { diameter: 30, length: 180, stemDiameter: 16, stemLength: 240 },
    position: [300, 620, 150],
    color: INS,
  },
  {
    id: 'SVP-INS-RTD2',
    oem: null,
    nameEn: 'Switch Bar RTD (SHAFT TE · RTD2)',
    system: 'instruments',
    primitive: 'probe',
    params: { diameter: 26, length: 140, stemDiameter: 14, stemLength: 100 },
    position: [-200, 470, SWITCHBAR_Z],
    color: INS,
  },
  {
    id: 'SVP-INS-PT01',
    oem: null,
    nameEn: 'Prover Pressure Transmitter (PIT-01)',
    system: 'instruments',
    primitive: 'probe',
    params: { diameter: 120, length: 160, stemDiameter: 40, stemLength: 260 },
    position: [-450, 620, 150],
    color: INS,
  },
  {
    id: 'SVP-INS-TW1',
    oem: null,
    nameEn: 'Prover Thermowell',
    system: 'instruments',
    // The sheath RTD1 sits inside — concentric with it, reaching into the bore.
    primitive: 'probe',
    params: { diameter: 46, length: 120, stemDiameter: 26, stemLength: 300 },
    position: [300, 520, 150],
    color: STEEL,
  },
  {
    id: 'SVP-INS-CTL',
    oem: null,
    nameEn: 'SVP Controller Enclosure',
    system: 'instruments',
    primitive: 'box',
    params: { width: 600, height: 700, depth: 250 },
    // Sat down on the skid rather than floating beside it.
    position: [1900, -380, -300],
    color: INS,
  },
  {
    id: 'SVP-INS-JB',
    oem: null,
    nameEn: 'Junction Box',
    system: 'instruments',
    primitive: 'box',
    params: { width: 300, height: 300, depth: 180 },
    position: [1560, -520, -520],
    color: INS,
  },
  {
    id: 'SVP-INS-CCB',
    oem: null,
    nameEn: 'Customer Connection Box (terminals 12–17)',
    system: 'instruments',
    // Only two signals leave here for the SFC332P: Run Permissive and Volume Pulse.
    primitive: 'box',
    params: { width: 360, height: 300, depth: 180 },
    position: [2200, -520, -300],
    color: INS,
  },

  /* ---- System 9 · piping — Process Piping (6) ---------------------------- */
  {
    id: 'SVP-PIP-IN',
    oem: null,
    nameEn: 'Inlet Piping (10" 600#)',
    system: 'piping',
    // Rises from skid level into the flank of the upstream flange, clear of the
    // shaft that runs out along the axis.
    primitive: 'pipe',
    params: { bore: EST.pipeBore, wall: EST.pipeWall, length: 1300, rise: 400, segments: 48 },
    position: [-2300, -750, 0],
    color: PIP,
  },
  {
    id: 'SVP-PIP-OUT',
    oem: null,
    nameEn: 'Outlet Piping (10" 600#)',
    system: 'piping',
    primitive: 'pipe',
    params: { bore: EST.pipeBore, wall: EST.pipeWall, length: 1300, rise: -400, segments: 48 },
    position: [1000, -350, 0],
    color: PIP,
  },
  {
    id: 'SVP-PIP-INF',
    oem: null,
    nameEn: 'Inlet Flange',
    system: 'piping',
    primitive: 'disc',
    params: { diameter: 508, thickness: 60, boreDiameter: EST.pipeBore },
    position: [-2330, -750, 0],
    color: PIP,
  },
  {
    id: 'SVP-PIP-OUF',
    oem: null,
    nameEn: 'Outlet Flange',
    system: 'piping',
    primitive: 'disc',
    params: { diameter: 508, thickness: 60, boreDiameter: EST.pipeBore },
    position: [2330, -750, 0],
    color: PIP,
  },
  {
    id: 'SVP-PIP-DRN',
    oem: null,
    nameEn: 'Drain Valve',
    system: 'piping',
    // Flipped: body below, stem reaching up into the low point of the bore.
    primitive: 'probe',
    params: { diameter: 120, length: 200, stemDiameter: 50, stemLength: 180 },
    position: [0, -620, 0],
    rotation: [Math.PI, 0, 0],
    color: PIP,
  },
  {
    id: 'SVP-PIP-VNT',
    oem: null,
    nameEn: 'Vent Valve',
    system: 'piping',
    primitive: 'probe',
    params: { diameter: 120, length: 200, stemDiameter: 50, stemLength: 180 },
    position: [0, 620, 0],
    color: PIP,
  },

  /* ---- System 10 · structure — Structure (5) ----------------------------- */
  {
    id: 'SVP-STR-BASE',
    oem: null,
    nameEn: 'Base Skid',
    system: 'structure',
    primitive: 'box',
    params: { width: OVERALL.baseLength, height: EST.baseThk, depth: OVERALL.overallWidth },
    position: [0, SKID_CY, 0],
    color: STR,
  },
  {
    id: 'SVP-STR-SUP1',
    oem: null,
    nameEn: 'Flow Tube Support (Upstream)',
    system: 'structure',
    primitive: 'box',
    params: {
      width: 220,
      height: OVERALL.centrelineHeight - FLOW_TUBE.outerDiameter / 2,
      depth: 900,
    },
    position: [
      -700,
      (SKID_Y - FLOW_TUBE.outerDiameter / 2) / 2,
      0,
    ],
    color: STR,
  },
  {
    id: 'SVP-STR-SUP2',
    oem: null,
    nameEn: 'Flow Tube Support (Downstream)',
    system: 'structure',
    primitive: 'box',
    params: {
      width: 220,
      height: OVERALL.centrelineHeight - FLOW_TUBE.outerDiameter / 2,
      depth: 900,
    },
    position: [
      700,
      (SKID_Y - FLOW_TUBE.outerDiameter / 2) / 2,
      0,
    ],
    color: STR,
  },
  {
    id: 'SVP-STR-LIFT',
    oem: null,
    nameEn: 'Lifting Lugs',
    system: 'structure',
    primitive: 'box',
    params: { width: 120, height: 160, depth: 30 },
    position: [0, SKID_Y + 80, OVERALL.overallWidth / 2 - 20],
    qty: 4,
    instance: { pattern: 'linear', spacing: 1600, axis: 'x' },
    color: STR,
  },
  {
    id: 'SVP-STR-NP',
    oem: null,
    nameEn: 'Nameplate (SVP-PR-8 · PR85-003 · SV085SE3)',
    system: 'structure',
    primitive: 'box',
    params: { width: 220, height: 150, depth: 8 },
    position: [-1700, -700, OVERALL.overallWidth / 2],
    color: PALETTE.accent,
  },
];

/* ------------------------------------------------------------ explode vectors */

/**
 * SPEC.md §5 — "Derive them systematically, do not hand-author 91 vectors."
 *
 * Direction, in the order the spec states the rules:
 *   piping                       → ±X, furthest of all
 *   base skid and structure      → −Y
 *   guide block, drive, detection → −Z, away from the flow tube
 *   seals, rings and washers     → radially outward in the YZ plane, at their own X
 *   parts inside the bore        → +Y
 *   axial parts                  → ±X, away from the origin
 *
 * Distance rises with the part's depth in the assembly, so the outer shell peels
 * away first and the innermost pieces travel furthest. That layering is what makes
 * an exploded view readable.
 */
const DEPTH: Record<SystemId, number> = {
  structure: 0,
  piping: 0,
  instruments: 1,
  flowtube: 1,
  drive: 2,
  detection: 2,
  upstream: 3,
  downstream: 3,
  guideblock: 3,
  piston: 4,
};

const BASE_DIST = 240;
const DEPTH_STEP = 210;

/** Rings, washers and thin bored discs — the parts that peel off radially. */
const isSealLike = (spec: PartSpec): boolean =>
  spec.primitive === 'ring' ||
  (spec.primitive === 'disc' &&
    (spec.params.thickness ?? 0) <= 20 &&
    (spec.params.boreDiameter ?? 0) > 0);

const normalise = (v: [number, number, number]): [number, number, number] => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return length < 1e-6 ? [0, 1, 0] : [v[0] / length, v[1] / length, v[2] / length];
};

function deriveExplode(spec: PartSpec): Pick<Part, 'explodeDir' | 'explodeDist'> {
  const [x, y, z] = spec.position;
  const depth = DEPTH[spec.system];
  const dist = BASE_DIST + depth * DEPTH_STEP;

  if (spec.system === 'piping') {
    return { explodeDir: [x >= 0 ? 1 : -1, 0, 0], explodeDist: 1600 };
  }
  if (spec.system === 'structure') {
    return { explodeDir: [0, -1, 0], explodeDist: 700 };
  }
  if (spec.system === 'guideblock' || spec.system === 'drive' || spec.system === 'detection') {
    return { explodeDir: [0, 0, -1], explodeDist: dist };
  }
  if (spec.system === 'instruments') {
    return { explodeDir: normalise([0, y, z]), explodeDist: dist };
  }
  if (isSealLike(spec)) {
    // Radially outward in the YZ plane, at the part's own X. A seal that sits on
    // the axis has no radial direction of its own, so it lifts straight up.
    return { explodeDir: normalise([0, y, z]), explodeDist: dist };
  }
  if (spec.system === 'piston') {
    return { explodeDir: [0, 1, 0], explodeDist: dist };
  }
  // Everything left is axial hardware: flanges, retainers, stops, shafts, bolts.
  return { explodeDir: [Math.sign(x) || 1, 0, 0], explodeDist: dist };
}

/* -------------------------------------------------------------------- output */

/** THE PART TABLE. 91 rows, explode vectors derived and normalised at load. */
export const PARTS: Part[] = SPECS.map((spec) => ({ ...spec, ...deriveExplode(spec) }));

/** Shown in the header, Human Atlas style (SPEC.md §5). */
export const PART_COUNT = PARTS.length;

export const partsBySystem = (system: SystemId): Part[] =>
  PARTS.filter((part) => part.system === system);

export const countBySystem = (system: SystemId): number =>
  PARTS.reduce((n, part) => (part.system === system ? n + 1 : n), 0);

/**
 * Bounding box of the assembled machine, in millimetres, used to frame the camera.
 *
 * Extents are taken **per axis** from the row's own parameters, in the primitive's
 * own build orientation. A single isotropic radius would pad the 5.2 m skid by
 * 2.6 m in every direction and hand the camera a cube, which pushes it so far back
 * that the machine reads as a model on a table. Row rotations are not applied: the
 * result is close enough to frame with, and no part row depends on it.
 */
function axisExtents(part: Part): [number, number, number] {
  const q = part.params;
  const v = (key: string, fallback = 0) => q[key] ?? fallback;

  switch (part.primitive) {
    case 'tube': {
      const r = v('outerDiameter', 100) / 2;
      return [v('length', 200) / 2, r, r];
    }
    case 'disc': {
      const r = v('diameter', 200) / 2;
      const stack = (part.instance ? 1 : (part.qty ?? 1)) * v('thickness', 20);
      return [stack / 2, r, r];
    }
    case 'rod': {
      const r = Math.max(v('diameter', 40), v('endDiameter', 0)) / 2;
      return [v('length', 600) / 2, r, r];
    }
    case 'ring': {
      const r = (v('diameter', 200) + v('cordDiameter', 10)) / 2;
      return [v('cordDiameter', 10) / 2, r, r];
    }
    case 'cone': {
      const r = Math.max(v('diameter', 300), v('tipDiameter', 0)) / 2;
      return [v('length', 140) / 2, r, r];
    }
    case 'helix': {
      const r = (v('diameter', 120) + v('wireDiameter', 12)) / 2;
      return [v('length', 300) / 2, r, r];
    }
    case 'box':
      return [v('width', 200) / 2, v('height', 100) / 2, v('depth', 100) / 2];
    case 'pipe': {
      const r = v('bore', 254) / 2 + v('wall', 20);
      if (v('loop', 0) >= 1) return [v('length', 1200) / 2 + r, v('rise', 0) / 2 + r, r];
      // An open run starts at the row position and ends at (length, rise, lateral),
      // so it is not centred on its own origin.
      return [
        Math.abs(v('length', 1200)) / 2 + r,
        Math.abs(v('rise', 0)) / 2 + r,
        Math.abs(v('lateral', 0)) / 2 + r,
      ];
    }
    case 'bolt': {
      const r = v('headDiameter', v('diameter', 24) * 1.7) / 2;
      return [(v('length', 110) + v('headThickness', 17)) / 2, r, r];
    }
    case 'probe': {
      const r = v('diameter', 46) / 2;
      return [r, (v('length', 130) + v('stemLength', 0)) / 2, r];
    }
    default:
      return [0, 0, 0];
  }
}

/** Where a row actually sits: an open `pipe` run grows away from its position. */
function axisCentre(part: Part): [number, number, number] {
  const [x, y, z] = part.position;
  if (part.primitive === 'pipe' && (part.params.loop ?? 0) < 1) {
    return [
      x + (part.params.length ?? 0) / 2,
      y + (part.params.rise ?? 0) / 2,
      z + (part.params.lateral ?? 0) / 2,
    ];
  }
  return [x, y, z];
}

function computeBounds() {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  for (const part of PARTS) {
    const centre = axisCentre(part);
    const extent = axisExtents(part);
    // A repeated set reaches beyond its own row position.
    const spread: [number, number, number] = [0, 0, 0];
    if (part.instance) {
      const n = (part.qty ?? 1) - 1;
      if (part.instance.pattern === 'linear') {
        const axis = { x: 0, y: 1, z: 2 }[part.instance.axis ?? 'x'];
        spread[axis] = (n * (part.instance.spacing ?? 0)) / 2;
      } else {
        const radius = part.instance.radius ?? 0;
        const axis = { x: 0, y: 1, z: 2 }[part.instance.axis ?? 'x'];
        for (const a of [0, 1, 2] as const) if (a !== axis) spread[a] = radius;
      }
    }

    for (const a of [0, 1, 2] as const) {
      const pad = extent[a] + spread[a];
      min[a] = Math.min(min[a], centre[a] - pad);
      max[a] = Math.max(max[a], centre[a] + pad);
    }
  }

  return {
    centre: [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2,
    ] as [number, number, number],
    halfWidth: (max[0] - min[0]) / 2,
    halfHeight: (max[1] - min[1]) / 2,
    halfDepth: (max[2] - min[2]) / 2,
  };
}

export const ASSEMBLY_BOUNDS = computeBounds();

/**
 * Integrity of the table itself. Part ids are frozen and must be unique, and the
 * per-system counts are declared in SPEC.md §5 — a row lost to a bad merge is the
 * kind of thing that goes unnoticed for a week, so it fails loudly in development.
 */
if (import.meta.env.DEV) {
  const ids = new Set<string>();
  for (const part of PARTS) {
    if (ids.has(part.id)) throw new Error(`parts.ts: duplicate part id ${part.id}`);
    ids.add(part.id);
  }
  if (PARTS.length !== 91) {
    throw new Error(`parts.ts: SPEC.md §5 enumerates 91 rows, found ${PARTS.length}`);
  }
  for (const system of SYSTEMS) {
    const actual = countBySystem(system.id);
    if (actual !== system.declared) {
      throw new Error(
        `parts.ts: system ${system.id} declares ${system.declared} rows, found ${actual}`,
      );
    }
  }
}
