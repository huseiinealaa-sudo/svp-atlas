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

/* ------------------------------------------------------------------- surface */

export type ThemeId = 'dark' | 'light';

/**
 * The background the machine is seen against, dark or light.
 *
 * SPEC.md §10 fixes one background, `#0d1117`, and that stays the default. The
 * light setting is **not a second design**: every one of the fourteen part colours
 * above is untouched, because those colours are the machine's identity — the
 * Guide Block is `#7c5cff` under either setting. Only the ground the machine
 * stands on changes.
 *
 * The light values are the exact counterparts of the Phase A shell tokens from the
 * same family the spec drew them from (GitHub's canvas / border / muted / fg
 * ramps): `#0d1117 → #f6f8fa`, `#161b22 → #ffffff`, `#30363d → #d0d7de`,
 * `#7d8590 → #57606a`, `#e6edf3 → #1f2328`, and the `#d29922` accent to its
 * light-mode sibling `#9a6700`, which is the same hue at the contrast the lighter
 * ground needs. Picking a colour by eye instead would have put a second identity
 * on screen; these are the ones already implied by §10.
 *
 * The UI shell reads these through CSS custom properties (`src/index.css`); the
 * canvas reads them here.
 */
export const SURFACE: Record<ThemeId, { background: string; grid: string; gridAccent: string }> = {
  dark: {
    background: '#0d1117',
    grid: '#30363d',
    gridAccent: '#3d444d',
  },
  light: {
    background: '#f6f8fa',
    grid: '#d0d7de',
    gridAccent: '#afb8c1',
  },
};

/**
 * Ambient fill per setting. A light ground bounces light the renderer does not
 * simulate, so the ambient term rises with it — without this the parts read as
 * cut-outs pasted onto paper. The key and fill directionals are untouched: the
 * shading that describes the geometry stays identical in both settings.
 */
export const AMBIENT_BY_THEME: Record<ThemeId, number> = {
  dark: 0.35, // SPEC.md §10
  light: 0.62,
};

/** Selection and hover highlight — SPEC.md §7, "Part gets an emissive highlight". */
export const HIGHLIGHT = {
  selected: '#d29922',
  selectedIntensity: 0.55,
  hovered: '#e6edf3',
  hoveredIntensity: 0.18,
  /** Everything that is not the isolated part — SPEC.md §7. */
  dimmedOpacity: 0.05,
} as const;

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
