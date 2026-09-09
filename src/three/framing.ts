import * as THREE from 'three';

/**
 * Camera framing maths, shared by the camera-reset button and — in Phase D — by
 * "isolate part". Pure: no react, no store.
 *
 * The target device is an iPad Pro used in both orientations (SPEC.md §1.6), and a
 * distance that frames the model at 1366×1024 crops it at 1024×1366. So the
 * distance is solved for the current aspect rather than hard-coded, and it is
 * solved from what the camera actually *sees*: a 5.2 m machine viewed three-quarters
 * on is much narrower on screen than its 5.2 m bounding box, and fitting the raw box
 * would leave the model marooned in empty space.
 *
 * All arguments are in **scene units** — millimetres are converted before they get
 * here (SPEC.md §1.5).
 */
export interface Box {
  halfWidth: number; // X
  halfHeight: number; // Y
  halfDepth: number; // Z
}

export interface FitExtents {
  /** Half-extent across the screen's horizontal axis. */
  halfWidth: number;
  /** Half-extent across the screen's vertical axis. */
  halfHeight: number;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * The half-extents of `box` as projected onto the screen axes of a camera looking
 * along `direction`. Exact for a box: every corner is tested.
 */
export function projectedExtents(box: Box, direction: THREE.Vector3): FitExtents {
  const forward = direction.clone().normalize();
  const right = new THREE.Vector3().crossVectors(WORLD_UP, forward);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0); // looking straight down
  right.normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();

  let halfWidth = 0;
  let halfHeight = 0;
  const corner = new THREE.Vector3();
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corner.set(sx * box.halfWidth, sy * box.halfHeight, sz * box.halfDepth);
        halfWidth = Math.max(halfWidth, Math.abs(corner.dot(right)));
        halfHeight = Math.max(halfHeight, Math.abs(corner.dot(up)));
      }
    }
  }
  return { halfWidth, halfHeight };
}

/** Distance at which a `halfWidth` × `halfHeight` screen-aligned box fits the frustum. */
export function fitDistance(
  extents: FitExtents,
  fovDegrees: number,
  aspect: number,
  margin = 1.12,
): number {
  const vFov = (fovDegrees * Math.PI) / 180;
  const tanV = Math.tan(vFov / 2);
  const tanH = tanV * aspect;
  const forHeight = extents.halfHeight / tanV;
  const forWidth = extents.halfWidth / tanH;
  return Math.max(forHeight, forWidth, 0.001) * margin;
}

/**
 * Camera position that frames `box` about `target`, keeping the viewing direction
 * of `home` — the reset button always returns to the same angle, and only the
 * distance adapts to the viewport.
 */
export function framePosition(
  home: readonly [number, number, number],
  target: readonly [number, number, number],
  box: Box,
  fovDegrees: number,
  aspect: number,
): THREE.Vector3 {
  const centre = new THREE.Vector3(target[0], target[1], target[2]);
  const offset = new THREE.Vector3(home[0], home[1], home[2]).sub(centre);
  if (offset.lengthSq() === 0) offset.set(0, 0, 1);
  const direction = offset.clone().normalize();
  const extents = projectedExtents(box, direction);
  return direction.multiplyScalar(fitDistance(extents, fovDegrees, aspect)).add(centre);
}
