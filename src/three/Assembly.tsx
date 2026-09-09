import { PARTS } from '../data/parts';
import type { Part } from '../data/parts';
import { PRIMITIVES } from './primitives';

/**
 * The assembled machine — SPEC.md §4.1.
 *
 * This component has one job: map over the part table and hand each row to the
 * primitive it names. It knows nothing about any individual part, and it must stay
 * that way. If a part needs special handling, the fix is a parameter on its
 * primitive, never a branch here and never a component of its own (SPEC.md §1.3).
 *
 * Phase D adds selection, isolation, per-system visibility and the explode offset
 * (`position + explodeDir · explodeDist · t`) — the row already carries every field
 * those need. Phase F drives the moving parts. Both hang off this same loop.
 */
function PartMesh({ part }: { part: Part }) {
  const Primitive = PRIMITIVES[part.primitive];

  return (
    <Primitive
      params={part.params}
      color={part.color}
      position={part.position}
      rotation={part.rotation}
      qty={part.qty}
      instance={part.instance}
    />
  );
}

export default function Assembly() {
  return (
    <group>
      {PARTS.map((part) => (
        <PartMesh key={part.id} part={part} />
      ))}
    </group>
  );
}
