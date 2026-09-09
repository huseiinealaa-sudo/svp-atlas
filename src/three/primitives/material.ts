import { useMemo } from 'react';
import * as THREE from 'three';

import { CUTAWAY_PLANES } from '../clipping';

/**
 * SPEC.md §10 — "Share materials across parts of the same colour."
 *
 * With ~91 parts on an iPad Pro at 60 fps we cannot afford a fresh
 * `MeshStandardMaterial` per mesh. Every primitive asks for its material here and
 * identical requests get the identical instance back, so the renderer batches
 * state changes instead of rebinding a new program for each part.
 *
 * The cache is module-level and intentionally never cleared: the set of distinct
 * (colour, finish, opacity, highlight, clip) combinations is bounded by the palette.
 *
 * `clip` is a boolean rather than the plane array itself so the key stays a string.
 * There is exactly one cutaway plane set in the application (`three/clipping.ts`),
 * and materials are shared — mutating `clippingPlanes` on a cached instance would
 * cut every other part painted the same colour, so the clipped variant has to be a
 * separate cache entry.
 */
export interface MaterialRequest {
  color: string;
  metalness?: number;
  roughness?: number;
  /** 0–1. Below 1 the material is transparent — isolate mode, Phase D. */
  opacity?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: THREE.Side;
  /** Apply the cutaway clipping planes — SPEC.md §7. */
  clip?: boolean;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

export function getMaterial(request: MaterialRequest): THREE.MeshStandardMaterial {
  const {
    color,
    metalness = 0.5,
    roughness = 0.45,
    opacity = 1,
    emissive = '#000000',
    emissiveIntensity = 0,
    side = THREE.FrontSide,
    clip = false,
  } = request;

  const key = `${color}|${metalness}|${roughness}|${opacity}|${emissive}|${emissiveIntensity}|${side}|${clip}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness,
    roughness,
    transparent: opacity < 1,
    opacity,
    emissive: new THREE.Color(emissive),
    emissiveIntensity,
    side,
    // Isolate mode fades parts to 0.05; without this they punch holes in each other.
    depthWrite: opacity >= 1,
    clippingPlanes: clip ? CUTAWAY_PLANES : undefined,
    // The cut edge has to fall out of the shadow too, or the flow tube keeps
    // casting a whole shadow of a half that is no longer there.
    clipShadows: clip,
  });
  cache.set(key, material);
  return material;
}

/** Hook form. Same instance for the same request, stable across re-renders. */
export function useMaterial(request: MaterialRequest): THREE.MeshStandardMaterial {
  const {
    color,
    metalness,
    roughness,
    opacity,
    emissive,
    emissiveIntensity,
    side,
    clip,
  } = request;
  return useMemo(
    () =>
      getMaterial({
        color,
        metalness,
        roughness,
        opacity,
        emissive,
        emissiveIntensity,
        side,
        clip,
      }),
    [color, metalness, roughness, opacity, emissive, emissiveIntensity, side, clip],
  );
}

/** Test seam / diagnostics: how many distinct materials the scene has allocated. */
export const materialCacheSize = (): number => cache.size;
