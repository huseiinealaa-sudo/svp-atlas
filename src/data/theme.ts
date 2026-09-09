/**
 * SPEC.md §10 — visual design.
 * The 3D palette. Materials are shared across parts of the same colour, so this
 * table is the single source of truth for every mesh colour in the scene.
 */

export const PALETTE = {
  background: '#0d1117',
  flowTube: '#8b95a5',
  pistonBody: '#c9a227',
  poppet: '#d4622a',
  seals: '#2f3640',
  shafts: '#b8bfc9',
  guideBlock: '#7c5cff',
  flag: '#ffd166',
  detector: '#e5484d',
  detectorTriggered: '#3fb950',
  switchBar: '#6b7280',
  drive: '#4b5563',
  instruments: '#58a6ff',
  piping: '#7d8590',
  structure: '#30363d',
  fluid: '#2f81f7',
  accent: '#d29922',
} as const;

/** Opacity of the fluid particles, per SPEC.md §10. */
export const FLUID_OPACITY = 0.7;

/** SPEC.md §10 — lighting rig. Positions are in scene units, not millimetres. */
export const LIGHTING: {
  keyPosition: [number, number, number];
  keyIntensity: number;
  fillPosition: [number, number, number];
  fillIntensity: number;
  ambientIntensity: number;
} = {
  keyPosition: [5, 8, 5],
  keyIntensity: 1.15,
  fillPosition: [-5, 3, -5],
  fillIntensity: 0.45,
  ambientIntensity: 0.35,
};

/** Home pose of the camera, in scene units. The reset button returns here. */
export const CAMERA_HOME: {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
} = {
  position: [2.4, 1.5, 2.8],
  target: [0, 0, 0],
  fov: 42,
};
