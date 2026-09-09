import { Html } from '@react-three/drei';

import { mmVec } from '../data/geometry';
import { PALETTE } from '../data/theme';
import { PRIMITIVES } from './primitives';
import type { PrimitiveId, PrimitiveProps } from './primitives';

/**
 * Phase B verification rig — SPEC.md §11 B: "All ten builders in
 * `three/primitives/`, each demoed once. Stop and verify."
 *
 * This is a *rig*, not product surface. Phase C replaces it with `Assembly.tsx`
 * driven by `parts.ts`; nothing here is imported by the atlas itself.
 *
 * Every dimension below is in millimetres, as everything under `data/` and every
 * primitive param is (SPEC.md §1.5). The parameters are chosen to look like the
 * part each primitive will actually build, so the verification is meaningful:
 * the `cone` is Poppet-shaped, the `box` is Guide Block-shaped, the `bolt` set is
 * a flange bolt circle.
 */
interface Demo {
  primitive: PrimitiveId;
  label: string;
  /** What this builder makes in the atlas — SPEC.md §4.2, right-hand column. */
  makes: string;
  props: PrimitiveProps;
}

const DEMOS: Demo[] = [
  {
    primitive: 'tube',
    label: 'tube',
    makes: 'Flow Tube · Igus Bushing',
    props: {
      color: PALETTE.flowTube,
      params: { outerDiameter: 420, innerDiameter: 330, length: 520 },
    },
  },
  {
    primitive: 'disc',
    label: 'disc',
    makes: 'flanges · stops · washers',
    props: {
      // A flange reads as machined steel here; the dark `structure` grey is kept
      // for the skid and end plates, where it belongs.
      color: PALETTE.shafts,
      params: { diameter: 460, thickness: 70, boreDiameter: 200 },
    },
  },
  {
    primitive: 'rod',
    label: 'rod',
    makes: 'shafts · Bearing Guide Bars',
    props: { color: PALETTE.shafts, params: { diameter: 56, length: 640 } },
  },
  {
    primitive: 'ring',
    label: 'ring',
    makes: 'o-rings · seals · retaining rings',
    props: {
      color: PALETTE.seals,
      params: { diameter: 380, cordDiameter: 34 },
      qty: 3,
      instance: { pattern: 'linear', spacing: 70, axis: 'x' },
    },
  },
  {
    primitive: 'cone',
    label: 'cone',
    makes: 'Poppet · tapered seats',
    props: {
      color: PALETTE.poppet,
      params: { diameter: 400, tipDiameter: 110, length: 300 },
    },
  },
  {
    primitive: 'helix',
    label: 'helix',
    makes: 'springs · Return Chains',
    props: {
      color: PALETTE.drive,
      params: { diameter: 250, wireDiameter: 26, length: 500, turns: 9 },
    },
  },
  {
    primitive: 'box',
    label: 'box',
    makes: 'Guide Block · Flag · Switch Bar · skid',
    props: {
      color: PALETTE.guideBlock,
      params: { width: 420, height: 260, depth: 240 },
    },
  },
  {
    primitive: 'pipe',
    label: 'pipe',
    makes: 'process piping, 10" 600#',
    props: {
      color: PALETTE.piping,
      // Swept elbow: a straight row would be rise = lateral = 0.
      params: { bore: 254, wall: 22, length: 480, rise: 260, segments: 48 },
      position: [-240, -130, 0],
    },
  },
  {
    primitive: 'bolt',
    label: 'bolt',
    makes: 'every bolt set — one InstancedMesh',
    props: {
      color: PALETTE.shafts,
      params: { diameter: 44, length: 280, headDiameter: 74, headThickness: 34 },
      qty: 8,
      instance: { pattern: 'circle', radius: 190, axis: 'x' },
    },
  },
  {
    primitive: 'probe',
    label: 'probe',
    makes: 'Optical Volume Switches · RTDs · PT',
    props: {
      color: PALETTE.detector,
      params: { diameter: 110, length: 320, stemDiameter: 50, stemLength: 200 },
    },
  },
];

/** Grid pitch, in millimetres. Five across, two down. */
const COLUMNS = 5;
const PITCH_X = 900;
const PITCH_Y = 900;
const ROWS = Math.ceil(10 / COLUMNS);

/**
 * Bounding half-extents of the rig, in millimetres, including the largest demo
 * body and the label strip under each cell. `Scene` frames the camera from these
 * so all ten builders are visible at 1024×1366 *and* 1366×1024 — SPEC.md §1.6.
 */
export const GALLERY_BOX = {
  halfWidth: (COLUMNS * PITCH_X) / 2,
  halfHeight: (ROWS * PITCH_Y) / 2 + 120,
  halfDepth: 340,
} as const;

const cellPosition = (index: number): [number, number, number] => {
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  return [
    (col - (COLUMNS - 1) / 2) * PITCH_X,
    (0.5 - row) * PITCH_Y,
    0,
  ];
};

export default function PrimitiveGallery() {
  return (
    <group>
      {DEMOS.map((demo, index) => {
        const Primitive = PRIMITIVES[demo.primitive];
        const cell = cellPosition(index);
        const inner = demo.props.position ?? [0, 0, 0];

        return (
          <group key={demo.primitive} position={mmVec(cell)}>
            <Primitive {...demo.props} position={inner} />
            <Html
              position={mmVec([0, -PITCH_Y * 0.42, 0])}
              center
              // Fixed screen size, not distanceFactor: a label that shrinks with the
              // model is unreadable at the portrait framing. Labels are annotation,
              // never a hit target — the model stays tappable underneath.
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div dir="ltr" className="whitespace-nowrap text-center">
                <div className="font-mono text-[13px] tracking-wide text-accent">
                  {demo.label}
                </div>
                <div className="text-[10px] text-muted">{demo.makes}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
