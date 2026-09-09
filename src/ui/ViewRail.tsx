import { useStore } from '../store/useStore';

/**
 * SPEC.md §7 — the vertical rail on the right edge.
 * Phase A carries reset-camera only; the ¾ / F / S / T view buttons and reset-all
 * arrive with the view cube in Phase D.
 *
 * Every button is at least 44 px square — SPEC.md §1.6.
 */
export default function ViewRail() {
  const resetCamera = useStore((s) => s.resetCamera);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center p-3">
      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={resetCamera}
          title="Reset camera"
          aria-label="Reset camera"
          className="flex h-touch min-h-touch w-touch min-w-touch items-center justify-center rounded-lg border border-edge bg-panel/90 font-mono text-base text-muted backdrop-blur transition-colors hover:border-accent hover:text-accent active:bg-edge"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
