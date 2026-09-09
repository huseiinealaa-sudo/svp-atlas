import { useStore, type ViewId } from '../store/useStore';

/**
 * SPEC.md §7 — "Right edge, vertical: ¾ F S T view buttons."
 *
 * Each button asks the camera for a viewing direction; `three/CameraDirector.tsx`
 * solves the distance for the current viewport and for whatever is being framed —
 * the whole machine, or one isolated part.
 */
const VIEWS: { id: ViewId; glyph: string; label: string }[] = [
  { id: 'iso', glyph: '¾', label: 'Three-quarter view' },
  { id: 'front', glyph: 'F', label: 'Front elevation' },
  { id: 'side', glyph: 'S', label: 'Side elevation, along the flow axis' },
  { id: 'top', glyph: 'T', label: 'Top view' },
];

export default function ViewCube() {
  const setView = useStore((s) => s.setView);
  const current = useStore((s) => s.camera.view);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-edge bg-panel/90 backdrop-blur">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => setView(view.id)}
          title={view.label}
          aria-label={view.label}
          aria-pressed={current === view.id}
          className={`flex h-touch min-h-touch w-touch min-w-touch items-center justify-center border-b border-edge font-mono text-[13px] last:border-b-0 transition-colors ${
            current === view.id ? 'bg-ink/70 text-accent' : 'text-muted hover:text-text'
          }`}
        >
          {view.glyph}
        </button>
      ))}
    </div>
  );
}
