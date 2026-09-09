import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { PARTS, type Part } from '../data/parts';
import { SCENE_SCALE } from '../data/geometry';
import { PALETTE } from '../data/theme';
import { useStore } from '../store/useStore';
import { explodedScenePosition } from './explode';
import { labelNodes, useLabelledParts } from './labelBus';

/**
 * Leader lines, and the per-frame projection that puts each chip beside the part it
 * names — SPEC.md §7.
 *
 * The leader runs from the part's exploded centre outward **along its own explode
 * direction**, so a label always sits on the side the part flew off to and never
 * crosses back over the machine. The chip lands on the projection of the leader's
 * far end.
 *
 * Two costs are deliberately controlled here:
 *
 *   - **One draw call for all 91 leaders.** A single `LineSegments` with a buffer
 *     sized for the whole table at mount; each frame rewrites the first `n` pairs
 *     and moves the draw range. No geometry is allocated while the user drags.
 *   - **A screen-space declutter.** 91 chips at 100 % explode overlap into noise,
 *     so the screen is a coarse grid and each chip claims **every cell it actually
 *     spans**, measured from the rendered node rather than assumed. Chips vary from
 *     "Flag" to "Customer Connection Box (terminals 12–17)"; claiming one cell each
 *     would let the long ones sit straight through their neighbours. Nearer parts
 *     are served first, which is the order a reader would want anyway. Nothing is
 *     dropped from the scene — only its label yields.
 */

/** How far past the part the leader reaches, in millimetres. */
const LEADER_MM = 240;

/** Gap between the end of the leader and the chip, in CSS pixels. */
const CHIP_GAP = 12;

/**
 * Declutter grid, in CSS pixels. Cells are much smaller than a chip: a chip claims
 * the range of cells it covers, so the grid only needs to be fine enough that two
 * chips sharing a cell really do touch.
 */
const CELL_W = 24;
const CELL_H = 12;

export default function Labels() {
  const parts = useLabelledParts();
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const lines = useRef<THREE.LineSegments>(null);

  // Sized for the whole table once: two endpoints per row, three floats each.
  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTS.length * 2 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(PALETTE.accent),
        transparent: true,
        opacity: 0.55,
        depthTest: false,
      }),
    [],
  );

  const scratch = useMemo(() => new THREE.Vector3(), []);
  const taken = useMemo(() => new Set<string>(), []);
  const order = useRef<{ part: Part; depth: number }[]>([]);
  // Chip text never changes, so its box is measured once per node. Reading
  // offsetWidth inside the write loop every frame would force a layout flush on
  // each of the 91 chips.
  const boxes = useMemo(() => new Map<string, { w: number; h: number }>(), []);

  // A new label set means new nodes; the measured boxes belong to the old ones.
  useEffect(() => {
    boxes.clear();
  }, [parts, boxes]);

  useFrame(() => {
    const mesh = lines.current;
    if (!mesh) return;

    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    if (parts.length === 0) {
      geometry.setDrawRange(0, 0);
      attribute.needsUpdate = true;
      return;
    }

    const t = useStore.getState().explode;
    const leader = LEADER_MM * SCENE_SCALE;
    const halfW = size.width / 2;
    const halfH = size.height / 2;

    // Depth sort: the chip nearest the viewer gets first claim on its cell.
    const ranked = order.current;
    ranked.length = 0;
    for (const part of parts) {
      const [x, y, z] = explodedScenePosition(part, t);
      scratch.set(x, y, z);
      ranked.push({ part, depth: scratch.distanceToSquared(camera.position) });
    }
    ranked.sort((a, b) => a.depth - b.depth);

    taken.clear();
    let vertex = 0;

    for (const { part } of ranked) {
      const node = labelNodes.get(part.id);
      const [x, y, z] = explodedScenePosition(part, t);

      const endX = x + part.explodeDir[0] * leader;
      const endY = y + part.explodeDir[1] * leader;
      const endZ = z + part.explodeDir[2] * leader;

      scratch.set(endX, endY, endZ).project(camera);
      const behind = scratch.z > 1;
      const screenX = (scratch.x + 1) * halfW;
      const screenY = (1 - scratch.y) * halfH;

      let box = boxes.get(part.id);
      if (node && (box === undefined || box.w === 0)) {
        box = { w: node.offsetWidth, h: node.offsetHeight };
        if (box.w > 0) boxes.set(part.id, box);
      }
      const width = box?.w ?? 0;
      const height = box?.h ?? CELL_H;

      // Chips sit to the right of their leader, and flip to the left rather than
      // run off the edge of the screen.
      const flip = screenX + CHIP_GAP + width > size.width - 8;
      const chipLeft = flip ? screenX - CHIP_GAP - width : screenX + CHIP_GAP;
      const chipTop = screenY - height / 2;

      const onScreen =
        !behind &&
        chipLeft > -width &&
        chipLeft < size.width &&
        screenY > -height &&
        screenY < size.height + height;

      // Claim every cell the chip actually covers — both the columns its width
      // spans and the rows its height spans. Claiming a single cell is what let
      // two chips a few pixels apart vertically sit on top of each other.
      const firstCol = Math.floor(chipLeft / CELL_W);
      const lastCol = Math.floor((chipLeft + Math.max(width, 1)) / CELL_W);
      const firstRow = Math.floor(chipTop / CELL_H);
      const lastRow = Math.floor((chipTop + Math.max(height, 1)) / CELL_H);

      let free = onScreen;
      for (let row = firstRow; free && row <= lastRow; row += 1) {
        for (let col = firstCol; free && col <= lastCol; col += 1) {
          if (taken.has(`${col}:${row}`)) free = false;
        }
      }
      if (free) {
        for (let row = firstRow; row <= lastRow; row += 1) {
          for (let col = firstCol; col <= lastCol; col += 1) taken.add(`${col}:${row}`);
        }
      }
      const show = free;

      if (node) {
        node.style.transform = `translate3d(${Math.round(chipLeft)}px, ${Math.round(screenY)}px, 0)`;
        node.style.visibility = show ? 'visible' : 'hidden';
      }

      if (show) {
        array[vertex++] = x;
        array[vertex++] = y;
        array[vertex++] = z;
        array[vertex++] = endX;
        array[vertex++] = endY;
        array[vertex++] = endZ;
      }
    }

    geometry.setDrawRange(0, vertex / 3);
    attribute.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  return <lineSegments ref={lines} geometry={geometry} material={material} frustumCulled={false} />;
}
