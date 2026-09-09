import { useStore } from '../store/useStore';
import { registerLabelNode, useLabelledParts } from '../three/labelBus';

/**
 * The floating labels of SPEC.md §7 — "OEM number + English name".
 *
 * These are DOM, not 3D text: a canvas font would need a downloaded typeface, and
 * SPEC.md §1.1 rules out asset files. DOM also gives the chips the IBM Plex Mono
 * already loaded for the rest of the interface, and makes them tappable.
 *
 * The layer only *renders* — every chip is positioned by `three/Labels.tsx`
 * writing to the node registered here (see `three/labelBus.ts`). React must not
 * own a position that changes sixty times a second.
 */
export default function LabelLayer() {
  const parts = useLabelledParts();
  const selectAndFrame = useStore((s) => s.selectAndFrame);
  const selectedId = useStore((s) => s.selectedId);

  if (parts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {parts.map((part) => (
        <button
          key={part.id}
          type="button"
          ref={(node) => registerLabelNode(part.id, node)}
          onClick={() => selectAndFrame(part.id)}
          // Hidden until the frame loop has a screen position for it, so a chip
          // never flashes at the top-left corner on the frame it mounts.
          style={{ visibility: 'hidden' }}
          className={`pointer-events-auto absolute left-0 top-0 flex min-h-[22px] -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none backdrop-blur transition-colors ${
            selectedId === part.id
              ? 'border-accent bg-panel text-accent'
              : 'border-edge bg-panel/85 text-muted hover:border-accent hover:text-text'
          }`}
        >
          <span className="text-text">{part.oem ?? '—'}</span>
          <span>{part.nameEn}</span>
        </button>
      ))}
    </div>
  );
}
