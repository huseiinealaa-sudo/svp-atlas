import { useStore } from '../store/useStore';
import ViewCube from './ViewCube';

/**
 * SPEC.md §7 — the vertical rail on the right edge: the four view buttons, then
 * reset-camera and reset-all, with the two view modes the rail also owns —
 * Cutaway (§7) and the dark / light setting.
 *
 * Every button is at least 44 px square — SPEC.md §1.6.
 */
export default function ViewRail() {
  const resetCamera = useStore((s) => s.resetCamera);
  const resetAll = useStore((s) => s.resetAll);
  const cutaway = useStore((s) => s.cutaway);
  const toggleCutaway = useStore((s) => s.toggleCutaway);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const button =
    'flex h-touch min-h-touch w-touch min-w-touch items-center justify-center rounded-lg border border-edge bg-panel/90 font-mono text-base backdrop-blur transition-colors active:bg-edge';

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center p-3">
      <div className="pointer-events-auto flex flex-col gap-2">
        <ViewCube />

        <button
          type="button"
          onClick={toggleCutaway}
          title="Cutaway — clip the near half of the Flow Tube"
          aria-label="Cutaway — clip the near half of the Flow Tube"
          aria-pressed={cutaway}
          className={`${button} ${cutaway ? 'border-accent text-accent' : 'text-muted hover:border-accent hover:text-accent'}`}
        >
          ◧
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light background' : 'Dark background'}
          aria-label={theme === 'dark' ? 'Switch to light background' : 'Switch to dark background'}
          className={`${button} text-muted hover:border-accent hover:text-accent`}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <button
          type="button"
          onClick={resetCamera}
          title="Reset camera"
          aria-label="Reset camera"
          className={`${button} text-muted hover:border-accent hover:text-accent`}
        >
          ↺
        </button>

        <button
          type="button"
          onClick={resetAll}
          title="Reset everything"
          aria-label="Reset everything"
          className={`${button} text-muted hover:border-accent hover:text-accent`}
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
