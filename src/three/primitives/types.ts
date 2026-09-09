/**
 * SPEC.md §4.2 — the ten primitive builders.
 *
 * Every part in the atlas is a *row* in the part table naming one of these ten
 * primitives plus its parameters. There is never one component per part
 * (SPEC.md §1.3). Adding a part means adding a row, not writing a file.
 *
 * All `params` values are in **millimetres** (or radians for angles).
 * Conversion to scene units happens inside the primitive, at the render
 * boundary, with `mm()` from `data/geometry.ts` — SPEC.md §1.5.
 */
import type { ThreeEvent } from '@react-three/fiber';

/** The ten primitive ids of SPEC.md §4.2. Frozen. */
export type PrimitiveId =
  | 'tube'
  | 'disc'
  | 'rod'
  | 'ring'
  | 'cone'
  | 'helix'
  | 'box'
  | 'pipe'
  | 'bolt'
  | 'probe';

/**
 * Repetition pattern for sets that render as a single `InstancedMesh`
 * — bolt sets, o-ring stacks, washer stacks. SPEC.md §4.2.
 */
export interface InstanceSpec {
  pattern: 'circle' | 'linear';
  /** Bolt-circle radius, mm. `circle` only. */
  radius?: number;
  /** Centre-to-centre spacing, mm. `linear` only. */
  spacing?: number;
  /** Axis the pattern is built about (`circle`) or along (`linear`). Default 'x'. */
  axis?: 'x' | 'y' | 'z';
}

/**
 * The props every primitive accepts. `Assembly.tsx` (Phase C) spreads a part row
 * straight into these; nothing else is needed to draw any of the ~93 parts.
 */
export interface PrimitiveProps {
  /** Primitive-specific dimensions, in millimetres. See each builder for its keys. */
  params: Record<string, number>;
  color: string;
  /** Assembled position, in millimetres. */
  position?: [number, number, number];
  /** Rotation in radians. */
  rotation?: [number, number, number];
  /** Number of copies when `instance` is given. Default 1. */
  qty?: number;
  instance?: InstanceSpec;
  /** 0–1. Below 1 the material becomes transparent — used by isolate mode in Phase D. */
  opacity?: number;
  /** Selection highlight — SPEC.md §7. */
  emissive?: string;
  emissiveIntensity?: number;
  /**
   * Cutaway — SPEC.md §7. When true the part's material carries the clipping
   * planes from `three/clipping.ts`, so the near half of it disappears.
   *
   * It is a per-part flag rather than a renderer setting on purpose: the Cutaway
   * exists to reveal the Piston, and a renderer-wide clip would cut the Piston in
   * half along with everything else. Only the rows in `CUTAWAY_PART_IDS` ever
   * receive it.
   */
  clip?: boolean;
  visible?: boolean;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}

/** Reads a numeric param, falling back when the row does not supply it. */
export const p = (params: Record<string, number>, key: string, fallback: number): number =>
  typeof params[key] === 'number' ? params[key] : fallback;
