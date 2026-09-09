import { SCENE_SCALE } from '../data/geometry';
import type { Part } from '../data/parts';

/**
 * The explode transform — SPEC.md §7: `basePos → basePos + dir·dist·t`.
 *
 * Pure. No react, no three, no store. It exists as its own module for one reason:
 * SPEC.md §11 D and §13 both require that **explode 0 → 100 → 0 returns to the exact
 * original transforms**, and a guarantee that strong has to be testable outside the
 * renderer. `scripts/verify-explode.ts` imports this file directly and sweeps every
 * one of the 93 rows through a full cycle, asserting bitwise equality on return.
 *
 * The guarantee holds by construction, not by luck:
 *
 *   - Every position is **recomputed from the frozen `part.position`**. Nothing
 *     accumulates a delta into a live transform, so there is no error to build up,
 *     however many times the slider is dragged.
 *   - `t === 0` returns the base triple itself. That makes the round trip an
 *     identity rather than an arithmetic coincidence, and it also skips 93 array
 *     allocations per frame while the model sits assembled — the common case.
 *
 * Positions in and out are **millimetres** (SPEC.md §1.5). `explodedScenePosition`
 * is the one place the render boundary conversion happens for a moving part.
 */

/** Explode fraction, 0 (assembled) → 1 (every piece). */
export type ExplodeT = number;

/** Where a part sits at explode `t`, in millimetres. */
export function explodedPosition(part: Part, t: ExplodeT): [number, number, number] {
  // Identity at rest — see the note above. This is the return leg of 100 → 0.
  if (t === 0) return part.position;

  const travel = part.explodeDist * t;
  return [
    part.position[0] + part.explodeDir[0] * travel,
    part.position[1] + part.explodeDir[1] * travel,
    part.position[2] + part.explodeDir[2] * travel,
  ];
}

/**
 * The same value in scene units, ready to be written straight onto a group.
 * Conversion happens exactly once, here, at the render boundary (SPEC.md §1.5).
 */
export function explodedScenePosition(part: Part, t: ExplodeT): [number, number, number] {
  const [x, y, z] = explodedPosition(part, t);
  return [x * SCENE_SCALE, y * SCENE_SCALE, z * SCENE_SCALE];
}

/**
 * The formula with no `t === 0` shortcut. Only `scripts/verify-explode.ts` uses it,
 * to prove that the round trip is exact on the arithmetic itself and is not merely
 * being rescued by the early return above.
 */
export function explodedPositionRaw(part: Part, t: ExplodeT): [number, number, number] {
  const travel = part.explodeDist * t;
  return [
    part.position[0] + part.explodeDir[0] * travel,
    part.position[1] + part.explodeDir[1] * travel,
    part.position[2] + part.explodeDir[2] * travel,
  ];
}

/** Labels appear above this explode fraction — SPEC.md §7, "above 5 % explode". */
export const LABEL_THRESHOLD = 0.05;
