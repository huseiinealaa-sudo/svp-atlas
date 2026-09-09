import { useStore } from '../store/useStore';

/**
 * SPEC.md §7 — the explode control.
 *
 * "Explode slider: 0–100 %, `basePos → basePos + dir·dist·t`. Fully reversible with
 * no drift." The maths lives in `three/explode.ts`; this is the handle on it, laid
 * out as the §7 mockup draws it — a separator, the percentage, a reset, and the two
 * end labels.
 *
 * The value is kept in hundredths so the native range step lands on exact
 * percentages, and dragging back to 0 gives back the integer 0 rather than
 * something that merely rounds to it — `three/explode.ts` treats an exact 0 as the
 * identity, which is what makes the return leg exact.
 */
export default function ExplodeSlider() {
  const explode = useStore((s) => s.explode);
  const setExplode = useStore((s) => s.setExplode);
  const percent = Math.round(explode * 100);

  return (
    <section
      dir="rtl"
      aria-label="Explode assembly"
      className="pointer-events-auto w-[min(420px,calc(100vw-2rem))]"
    >
      <div className="mb-1.5 flex items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 bg-edge" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Separated components
        </span>
        <span className="h-px flex-1 bg-edge" />
      </div>

      <div className="rounded-xl border border-edge bg-panel/90 px-3 pb-1.5 pt-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-[12px] text-text" dir="ltr">
            Explode assembly
          </span>
          <span dir="ltr" className="font-mono text-[12px] tabular-nums text-accent">
            {percent} %
          </span>
          <button
            type="button"
            onClick={() => setExplode(0)}
            disabled={explode === 0}
            aria-label="Reassemble"
            title="Reassemble"
            className="flex h-touch min-h-touch w-touch min-w-touch items-center justify-center rounded-lg font-mono text-base text-muted hover:text-accent disabled:opacity-30"
          >
            ↺
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(event) => setExplode(Number(event.target.value) / 100)}
          aria-label="Explode assembly"
          aria-valuetext={`${percent} percent`}
          // The track is LTR inside an RTL panel on purpose: it runs from
          // "Assembled" to "Every piece", and those two end labels are English.
          // Mirrored, the thumb would sit at the left at 100 % and contradict them.
          dir="ltr"
          className="explode-range"
        />

        <div className="-mt-1 flex justify-between font-mono text-[10px] text-muted" dir="ltr">
          <span>Assembled</span>
          <span>Every piece</span>
        </div>
      </div>
    </section>
  );
}
