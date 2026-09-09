/**
 * Identity of the specific machine this atlas models.
 * Values are taken from the SVP-PR-8 nameplate and the live WinSFC configuration
 * (SPEC.md §5, system 10 · `SVP-STR-NP`).
 *
 * The reference run used by the numeric readout is added in Phase G.
 */
export const SITE = {
  tag: 'SVP-PR-8',
  serial: 'PR85-003',
  modelCode: 'SV085SE3',
  model: 'Model 85',
  manufacturer: 'Honeywell Enraf · Calibron',
  flowComputer: 'SFC332P',
  /** SPEC.md §5 — the atlas is complete at ~91 individually selectable pieces. */
  targetPieceCount: 91,
} as const;
