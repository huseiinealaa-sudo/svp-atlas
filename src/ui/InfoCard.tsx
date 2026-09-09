import { SYSTEMS } from '../data/parts';
import { useStore, partById } from '../store/useStore';

/**
 * SPEC.md §7 — the info card. "Tap a part → info card opens."
 *
 * **Phase D builds the card, not its content.** The bilingual `functionAr` and
 * `failureAr` prose of SPEC.md §6 is `data/content.ts`, Phase E; writing Arabic
 * text here now would mean writing it twice, and the spec is explicit that every
 * entry ships complete rather than as a placeholder. So the card shows what the
 * part table already knows — identity, system, OEM item, quantity — and the two
 * actions §7 names: Isolate part, and Clear selection.
 *
 * The Arabic name and the two prose blocks slot in between the title and the OEM
 * grid when Phase E lands. Nothing else about this component changes.
 */
export default function InfoCard() {
  const selectedId = useStore((s) => s.selectedId);
  const isolatedId = useStore((s) => s.isolatedId);
  const isolate = useStore((s) => s.isolate);
  const clearIsolate = useStore((s) => s.clearIsolate);
  const select = useStore((s) => s.select);

  const part = partById(selectedId);
  if (!part) return null;

  const system = SYSTEMS.find((candidate) => candidate.id === part.system);
  const isolated = isolatedId === part.id;

  return (
    <section
      dir="rtl"
      aria-label="Component detail"
      className="pointer-events-auto w-[248px] overflow-hidden rounded-xl border border-edge bg-panel/90 backdrop-blur"
    >
      <header className="flex items-center gap-2 border-b border-edge px-3 py-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: system?.color }}
          aria-hidden="true"
        />
        <h2 className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.1em] text-muted" dir="ltr">
          {system?.nameEn}
        </h2>
      </header>

      <div className="px-3 py-3">
        <p className="text-[15px] font-semibold leading-snug text-text" dir="ltr">
          {part.nameEn}
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted" dir="ltr">
          {part.id}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-edge pt-2" dir="ltr">
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">OEM Item</dt>
          <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">Qty</dt>
          <dd className="font-mono text-[13px] text-accent">{part.oem ?? '—'}</dd>
          <dd className="font-mono text-[13px] text-text">{part.qty ?? 1}</dd>
        </dl>

        <p
          className="mt-3 border-t border-edge pt-2 font-mono text-[10px] leading-relaxed text-muted"
          dir="ltr"
        >
          Function and failure notes — Phase E
        </p>
      </div>

      <footer className="flex flex-col border-t border-edge">
        <button
          type="button"
          onClick={() => (isolated ? clearIsolate() : isolate(part.id))}
          className="flex min-h-touch items-center justify-between border-b border-edge px-3 text-[12px] text-text hover:bg-ink/50"
        >
          <span>{isolated ? 'Exit isolation' : 'Isolate part'}</span>
          <span className="font-mono text-muted" aria-hidden="true">
            {isolated ? '✕' : '‹'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (isolated) clearIsolate();
            select(null);
          }}
          className="flex min-h-touch items-center px-3 text-[12px] text-muted hover:bg-ink/50 hover:text-text"
        >
          Clear selection
        </button>
      </footer>
    </section>
  );
}
