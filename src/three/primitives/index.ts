/**
 * The primitive registry — SPEC.md §4.2.
 *
 * `Assembly.tsx` (Phase C) looks a row's `primitive` up here and renders it.
 * Ten entries, and never an eleventh without a change to the spec.
 */
import type { ComponentType } from 'react';

import Tube from './Tube';
import Disc from './Disc';
import Rod from './Rod';
import Ring from './Ring';
import Cone from './Cone';
import Helix from './Helix';
import Box from './Box';
import Pipe from './Pipe';
import Bolt from './Bolt';
import Probe from './Probe';
import type { PrimitiveId, PrimitiveProps } from './types';

export const PRIMITIVES: Record<PrimitiveId, ComponentType<PrimitiveProps>> = {
  tube: Tube,
  disc: Disc,
  rod: Rod,
  ring: Ring,
  cone: Cone,
  helix: Helix,
  box: Box,
  pipe: Pipe,
  bolt: Bolt,
  probe: Probe,
};

export const PRIMITIVE_IDS = Object.keys(PRIMITIVES) as PrimitiveId[];

export { Tube, Disc, Rod, Ring, Cone, Helix, Box, Pipe, Bolt, Probe };
export type { PrimitiveId, PrimitiveProps, InstanceSpec } from './types';
export { getMaterial, useMaterial, materialCacheSize } from './material';
export { InstancedSet, instanceOffsets } from './instancing';
