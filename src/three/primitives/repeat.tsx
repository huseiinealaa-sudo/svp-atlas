import type { ReactNode } from 'react';
import type * as THREE from 'three';

/**
 * Repetition for the low-count builders — `tube`, `rod`, `cone`, `helix`, `pipe`,
 * `probe`.
 *
 * `bolt`, `ring`, `box` and `disc` repeat through `InstancedMesh` because a flange
 * carries twenty of them (SPEC.md §4.2). The builders here repeat two to six times
 * — two Bearing Guide Bars, two Cam Followers, two Shock Absorbers, a six-high
 * Belleville stack — where an InstancedMesh buys nothing and costs the ability to
 * give each copy its own transform later. The geometry and the material are still
 * shared, so a two-copy row is two draw calls against one buffer.
 *
 * Every primitive therefore honours `qty` + `instance` the same way, and a part row
 * never has to care which path its builder takes.
 *
 * NOTE for part rows: offsets are applied *inside* the row's rotated group, so an
 * `instance.axis` is read in the row's own local frame, not the world frame.
 */
export function Repeated({
  offsets,
  children,
}: {
  offsets: THREE.Vector3[];
  children: ReactNode;
}) {
  if (offsets.length <= 1) return <>{children}</>;
  return (
    <>
      {offsets.map((offset, i) => (
        <group key={i} position={[offset.x, offset.y, offset.z]}>
          {children}
        </group>
      ))}
    </>
  );
}
