import { PARTS, SYSTEMS, countBySystem } from '../data/parts';
import { useStore } from '../store/useStore';

/**
 * SPEC.md §7 — the Systems panel.
 *
 * "System row: toggles visibility. Coloured dot matches the system colour in 3D.
 * Live piece count." Plus the footer the mockup shows: how many pieces are on
 * screen right now, and Hide all / Show all.
 *
 * Counts come from the table, never from a number typed here (SPEC.md §5).
 */
export default function SystemsPanel() {
  const hiddenSystems = useStore((s) => s.hiddenSystems);
  const toggleSystem = useStore((s) => s.toggleSystem);
  const setAllSystems = useStore((s) => s.setAllSystems);

  const visibleCount = PARTS.reduce(
    (n, part) => (hiddenSystems.includes(part.system) ? n : n + 1),
    0,
  );
  const allHidden = hiddenSystems.length === SYSTEMS.length;

  return (
    <section
      dir="rtl"
      aria-label="Systems"
      className="pointer-events-auto w-[224px] overflow-hidden rounded-xl border border-edge bg-panel/90 backdrop-blur"
    >
      <header className="flex items-center justify-between border-b border-edge px-3 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Systems</h2>
        <span className="font-mono text-[11px] text-text">{SYSTEMS.length}</span>
      </header>

      <ul className="max-h-[46vh] overflow-y-auto">
        {SYSTEMS.map((system) => {
          const hidden = hiddenSystems.includes(system.id);
          return (
            <li key={system.id}>
              <button
                type="button"
                onClick={() => toggleSystem(system.id)}
                aria-pressed={!hidden}
                className={`flex min-h-touch w-full items-center gap-2 border-b border-edge/50 px-3 text-right last:border-b-0 hover:bg-ink/50 ${
                  hidden ? 'opacity-40' : ''
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: system.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[12px] text-text" dir="ltr">
                  {system.nameEn}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  {countBySystem(system.id)}
                </span>
                <span className="w-3 shrink-0 text-center font-mono text-[11px] text-muted">
                  {hidden ? '○' : '◉'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="flex items-center justify-between border-t border-edge px-3 py-1.5">
        <span dir="ltr" className="font-mono text-[11px] text-muted">
          <span className="text-text">{visibleCount}</span> visible
        </span>
        <button
          type="button"
          onClick={() => setAllSystems(allHidden)}
          className="min-h-touch px-1 font-mono text-[11px] text-muted hover:text-accent"
        >
          {allHidden ? 'Show all' : 'Hide all'}
        </button>
      </footer>
    </section>
  );
}
