import * as THREE from 'three';

/**
 * Cutaway — SPEC.md §7: "Clips the near half of the flow tube (`clippingPlanes`,
 * normal `[0,0,1]`) so the piston is visible inside."
 *
 * The plane's axis is Z, as the spec says. The **sign** is chosen so the half that
 * disappears is the near one: three.js keeps the side where `normal·p + constant`
 * is positive, so a normal of `[0,0,-1]` keeps `z < 0` — the far half — and takes
 * away the half between the viewer and the piston. A normal of `[0,0,+1]` would cut
 * the far wall and leave the near wall standing in front of everything, which is
 * the opposite of a cutaway.
 *
 * Scope is the Flow Tube alone (`CUTAWAY_PART_IDS` in `data/parts.ts`). These
 * planes are handed to the *material*, never to the renderer: a renderer-wide
 * clip would slice the Piston in half too.
 *
 * The array is a module-level singleton so that every clipped material shares the
 * same object, and so `material.ts` can cache on a single boolean.
 */
export const CUTAWAY_PLANES: THREE.Plane[] = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
