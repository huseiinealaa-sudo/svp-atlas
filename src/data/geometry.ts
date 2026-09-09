/**
 * Dimensional constants for the Honeywell Enraf / Calibron Small Volume Prover,
 * Model 85, tag SVP-PR-8.
 *
 * SPEC.md §1.5 — EVERY dimension in this directory is in **millimetres**.
 * Convert exactly once, at the render boundary, with `SCENE_SCALE`.
 * Never hard-code a dimension inside a component.
 */

/** Millimetres → three.js scene units. Applied once, at the render boundary. */
export const SCENE_SCALE = 0.001;

/** Convert a millimetre value to scene units. */
export const mm = (value: number): number => value * SCENE_SCALE;

/** Convert a millimetre triple to scene units. */
export const mmVec = ([x, y, z]: readonly [number, number, number]): [number, number, number] => [
  x * SCENE_SCALE,
  y * SCENE_SCALE,
  z * SCENE_SCALE,
];

/**
 * SPEC.md §4.4 — verified from the manufacturer manual.
 * Source: Calibron SVP Operation & Installation Manual, doc 44103445 Rev 0, Figure 1.
 */
export const OVERALL = {
  baseLength: 5230,
  overallWidth: 1270,
  overallHeight: 1230,
  centrelineHeight: 762,
  dimE: 1930,
  dimF: 2110,
} as const;

/**
 * SPEC.md §4.5 — verified against the live WinSFC configuration of SVP-PR-8.
 * `wallThickness` is flagged [VERIFY UNIT ON SITE] in the spec; it is carried through unchanged.
 */
export const FLOW_TUBE = {
  innerDiameter: 673.11, // "Prover Diameter (ID)" — 67.311 cm
  wallThickness: 73.835, // "Wall Thickness" — 7.3835 cm   [VERIFY UNIT ON SITE]
  outerDiameter: 820.78,
  length: 1930,
} as const;

/** Process flanges. The manual lists 12 inch for Model 85, but SVP-PR-8 is built 10 inch ANSI 600#. */
export const FLANGE_SPEC = {
  nominalSizeInch: 10,
  ansiClass: 600,
} as const;

/**
 * SPEC.md §4.6 — derived from the verified figures above, not guessed.
 *   bore area         = π/4 × 0.67311²      = 0.355838 m²
 *   calibrated stroke = 0.28415 / 0.355838  = 798.5 mm
 *   pre-travel (25 %)                       = 199.6 mm
 */
export const TRAVEL = {
  calibratedStroke: 798.5,
  preTravel: 199.6,
  postTravel: 150, // [EST]
  boreAreaM2: 0.355838,
} as const;

/**
 * Axial landmarks along +X (the direction of flow).
 * SPEC.md §4.3 — origin is the centre of the flow tube bore at the axial midpoint
 * of the calibrated section.
 */
export const AXIAL = {
  detector1X: -399.25,
  detector2X: +399.25,
  launchX: -598.85,
  stopX: +549.25,
} as const;

/**
 * SPEC.md §4.7 — proportional estimates. Appearance only; these drive how the model
 * *looks*, never what it *measures*. Marked [EST] in the spec.
 */
export const EST = {
  pistonBodyDia: 670,
  pistonBodyLen: 240,
  poppetDia: 300,
  poppetLen: 140,
  poppetOpenTravel: 60,
  shaftDia: 70,
  shaftLen: 1400,
  flangeOD: 900,
  flangeThk: 90,
  flangeBolts: 20,
  flangeBoltCircle: 780,
  pipeBore: 254,
  pipeWall: 20,
  pipeLen: 1200,
  switchBarLen: 1400,
  switchBarW: 90,
  switchBarH: 70,
  switchBarZ: -520,
  guideBarLen: 2000,
  guideBarDia: 40,
  guideBlockW: 220,
  guideBlockH: 160,
  guideBlockD: 180,
  flagLen: 120,
  flagW: 8,
  flagH: 60,
  detectorDia: 46,
  detectorLen: 130,
  motorDia: 260,
  motorLen: 420,
  motorX: -1500,
  gearboxW: 380,
  chainZ: -640,
  driveZ: -600,
  baseLen: 5230,
  baseW: 1270,
  baseThk: 160,
  instrDia: 90,
  instrLen: 220,
  instrStem: 180,
  boltDia: 24,
  boltLen: 110,
  oRingTube: 10,
} as const;
