/**
 * Proof that explode 0 → 100 → 0 returns to the exact original transforms.
 *
 * SPEC.md §11 D: "Explode must return to exact original transforms."
 * SPEC.md §13:   "Explode 0→100→0 is smooth and returns to exact original positions."
 *
 * "Exact" is taken literally here: every one of the 93 rows × 3 axes must come back
 * **bit for bit**, compared with `Object.is`, not within a tolerance. A tolerance
 * would pass an implementation that accumulates a little error on every drag, which
 * is precisely the failure this check exists to rule out.
 *
 * The sweep is deliberately unkind. It runs the full ramp up and back, then a
 * pseudo-random walk of a thousand steps with awkward fractions, then returns to
 * zero — because a user drags a slider back and forth, not once.
 *
 * Run:  npm run verify:explode
 */
import * as THREE from 'three';

import { PARTS, validateParts, type Part } from '../src/data/parts';
import {
  explodedPosition,
  explodedPositionRaw,
  explodedScenePosition,
} from '../src/three/explode';

type Triple = [number, number, number];

let failures = 0;

function fail(message: string): void {
  failures += 1;
  console.error(`  ✗ ${message}`);
}

function pass(message: string): void {
  console.log(`  ✓ ${message}`);
}

/** Bitwise identity, per component. `Object.is` also separates -0 from +0. */
function identical(a: Triple, b: Triple): boolean {
  return Object.is(a[0], b[0]) && Object.is(a[1], b[1]) && Object.is(a[2], b[2]);
}

const fmt = (v: Triple): string => `[${v[0]}, ${v[1]}, ${v[2]}]`;

/* -------------------------------------------------------- the table itself */

console.log('\nSVP Atlas — explode round-trip verification\n');
console.log(`Part table: ${PARTS.length} rows`);

try {
  validateParts();
  pass(`parts.ts integrity — ${PARTS.length} unique ids, declared system counts, unit explode vectors`);
} catch (error) {
  fail(`parts.ts integrity: ${(error as Error).message}`);
}

/* ------------------------------------------------------------- the sweep */

/**
 * Deterministic pseudo-random walk. A fixed seed keeps a failure reproducible;
 * the fractions are deliberately ugly so nothing lands on a round number.
 */
function* sweep(): Generator<number> {
  for (let i = 0; i <= 100; i += 1) yield i / 100; // 0 → 1
  for (let i = 100; i >= 0; i -= 1) yield i / 100; // 1 → 0
  for (let i = 0; i <= 100; i += 1) yield i / 300 + 0.0137; // partial drags
  let seed = 0x5bd1e995;
  for (let i = 0; i < 1000; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    yield (seed % 1_000_000) / 1_000_000;
  }
  yield 1; // fully apart …
  yield 0; // … and all the way home
}

const baseline = new Map<string, Triple>();
const sceneBaseline = new Map<string, Triple>();
for (const part of PARTS) {
  baseline.set(part.id, [...explodedPosition(part, 0)] as Triple);
  sceneBaseline.set(part.id, [...explodedScenePosition(part, 0)] as Triple);
}

let steps = 0;
let lastT = 0;
for (const t of sweep()) {
  steps += 1;
  lastT = t;
  for (const part of PARTS) {
    // Exercise both consumers of the maths: the millimetre value and the scene
    // value the driver actually writes onto the group each frame.
    explodedPosition(part, t);
    explodedScenePosition(part, t);
  }
}

console.log(`Sweep: ${steps} slider positions across all ${PARTS.length} rows, ending at t = ${lastT}`);

if (lastT !== 0) fail(`the sweep must end assembled; it ended at t = ${lastT}`);

let drifted: Part[] = [];
for (const part of PARTS) {
  const now = [...explodedPosition(part, 0)] as Triple;
  const before = baseline.get(part.id) as Triple;
  if (!identical(now, before)) {
    drifted.push(part);
    fail(`${part.id} mm: ${fmt(before)} → ${fmt(now)}`);
  }
}
if (drifted.length === 0) {
  pass(`all ${PARTS.length} rows return to their exact millimetre position (Object.is on 273 components)`);
}

drifted = [];
for (const part of PARTS) {
  const now = [...explodedScenePosition(part, 0)] as Triple;
  const before = sceneBaseline.get(part.id) as Triple;
  if (!identical(now, before)) {
    drifted.push(part);
    fail(`${part.id} scene units: ${fmt(before)} → ${fmt(now)}`);
  }
}
if (drifted.length === 0) {
  pass('all rows return to their exact scene-unit position — the value ExplodeDriver writes');
}

/* ------------------------------------- the same sweep, on the real objects */

// The two checks above prove the arithmetic. This one proves what the scene
// actually holds: 93 real THREE.Group instances, positioned by the same loop
// `ExplodeDriver` runs every frame, dragged through the same sweep, then read back
// off `group.position`. If `Vector3.set` or the driver's loop lost anything, it
// shows up here and not in the maths.
const groups = new Map<string, THREE.Group>();
for (const part of PARTS) {
  const group = new THREE.Group();
  const [x, y, z] = explodedScenePosition(part, 0);
  group.position.set(x, y, z);
  groups.set(part.id, group);
}

const objectBaseline = new Map<string, Triple>();
for (const [id, group] of groups) {
  objectBaseline.set(id, [group.position.x, group.position.y, group.position.z]);
}

for (const t of sweep()) {
  for (const part of PARTS) {
    const group = groups.get(part.id);
    if (!group) continue;
    const [x, y, z] = explodedScenePosition(part, t);
    group.position.set(x, y, z);
  }
}

let objectDrift = 0;
for (const part of PARTS) {
  const group = groups.get(part.id) as THREE.Group;
  const now: Triple = [group.position.x, group.position.y, group.position.z];
  const before = objectBaseline.get(part.id) as Triple;
  if (!identical(now, before)) {
    objectDrift += 1;
    fail(`${part.id} group.position: ${fmt(before)} → ${fmt(now)}`);
  }
}
if (objectDrift === 0) {
  pass(
    `${PARTS.length} THREE.Group transforms driven through the whole sweep return bit for bit`,
  );
}

// And the transforms three.js will actually render with, not just the vectors.
let matrixDrift = 0;
for (const part of PARTS) {
  const group = groups.get(part.id) as THREE.Group;
  group.updateMatrix();
  const reference = new THREE.Group();
  const [x, y, z] = explodedScenePosition(part, 0);
  reference.position.set(x, y, z);
  reference.updateMatrix();
  for (let i = 0; i < 16; i += 1) {
    if (!Object.is(group.matrix.elements[i], reference.matrix.elements[i])) {
      matrixDrift += 1;
      fail(`${part.id} local matrix element ${i} differs after the round trip`);
      break;
    }
  }
}
if (matrixDrift === 0) pass('every local matrix matches the assembled matrix element for element');

/* --------------------------------------------- the maths, not the shortcut */

// `explodedPosition` short-circuits at t === 0. That is what makes the round trip
// an identity, but it must not be the *only* reason: the raw formula has to land on
// the base position too, or a future caller that skips the shortcut would drift.
let rawMismatch = 0;
for (const part of PARTS) {
  const raw = [...explodedPositionRaw(part, 0)] as Triple;
  if (!identical(raw, baseline.get(part.id) as Triple)) {
    rawMismatch += 1;
    fail(`${part.id} raw formula at t=0: ${fmt(baseline.get(part.id) as Triple)} → ${fmt(raw)}`);
  }
}
if (rawMismatch === 0) {
  pass('the formula itself is an identity at t = 0 — the early return is an optimisation, not a crutch');
}

/* ---------------------------------------------- the offset actually applied */

let travelErrors = 0;
let maxTravelError = 0;
for (const part of PARTS) {
  const at1 = explodedPosition(part, 1);
  const dx = at1[0] - part.position[0];
  const dy = at1[1] - part.position[1];
  const dz = at1[2] - part.position[2];
  const travelled = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const error = Math.abs(travelled - part.explodeDist);
  maxTravelError = Math.max(maxTravelError, error);
  if (error > 1e-9) {
    travelErrors += 1;
    fail(`${part.id} travels ${travelled.toFixed(6)} mm at 100 %, expected ${part.explodeDist}`);
  }
}
if (travelErrors === 0) {
  pass(
    `every row travels exactly its explodeDist at 100 % (worst error ${maxTravelError.toExponential(2)} mm)`,
  );
}

// Halfway must be halfway: the transform is linear in t, so the slider reads true.
let linearityErrors = 0;
for (const part of PARTS) {
  const half = explodedPosition(part, 0.5);
  const full = explodedPosition(part, 1);
  for (const axis of [0, 1, 2] as const) {
    const expected = part.position[axis] + (full[axis] - part.position[axis]) / 2;
    if (Math.abs(half[axis] - expected) > 1e-9) {
      linearityErrors += 1;
      fail(`${part.id} axis ${axis} is not linear in t`);
    }
  }
}
if (linearityErrors === 0) pass('the transform is linear in t — 50 % is half of 100 % on every axis');

/* ------------------------------------------------------------------ report */

const moved = PARTS.filter((part) => part.explodeDist > 0).length;
console.log(
  `\nRows with a non-zero explode distance: ${moved} / ${PARTS.length}` +
    `   ·   furthest ${Math.max(...PARTS.map((p) => p.explodeDist))} mm`,
);

if (failures > 0) {
  console.error(`\nFAILED — ${failures} problem${failures === 1 ? '' : 's'}\n`);
  process.exit(1);
}
console.log('\nPASSED — explode 0 → 100 → 0 is exact.\n');
