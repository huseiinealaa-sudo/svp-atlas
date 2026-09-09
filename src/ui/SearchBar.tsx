import { useMemo, useRef, useState } from 'react';

import { PARTS, SYSTEMS, type Part } from '../data/parts';
import { useStore } from '../store/useStore';

/**
 * SPEC.md §7 — "Live filter across `nameEn`, `nameAr`, `oem`. Selecting a result
 * selects and frames that part. Typing `54003` must find the Poppet."
 *
 * `nameAr` does not exist yet: bilingual content is `data/content.ts`, Phase E.
 * The matcher below already reads it from an optional field, so wiring Arabic
 * search in Phase E is one line here and no change to this component's shape.
 *
 * Matching is deliberately plain substring, not fuzzy. The things a user types
 * into this box are OEM item numbers off a drawing and part names off a manual;
 * fuzzy matching on a five-digit number turns `54003` into a list of everything
 * that happens to contain a 5, 4 or 3.
 */

const MAX_RESULTS = 12;

/** Phase E gives every row an Arabic name; until then this reads as undefined. */
type Searchable = Part & { nameAr?: string };

const systemName = (part: Part): string =>
  SYSTEMS.find((system) => system.id === part.system)?.nameEn ?? part.system;

function matches(part: Searchable, needle: string): boolean {
  if (part.oem !== null && part.oem.toLowerCase().includes(needle)) return true;
  if (part.nameEn.toLowerCase().includes(needle)) return true;
  if (part.nameAr !== undefined && part.nameAr.includes(needle)) return true;
  if (part.id.toLowerCase().includes(needle)) return true;
  return systemName(part).toLowerCase().includes(needle);
}

export default function SearchBar() {
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const selectAndFrame = useStore((s) => s.selectAndFrame);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return [];
    const hits: Part[] = [];
    for (const part of PARTS) {
      if (matches(part, needle)) hits.push(part);
      if (hits.length === MAX_RESULTS) break;
    }
    return hits;
  }, [query]);

  const total = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return 0;
    return PARTS.reduce((n, part) => (matches(part, needle) ? n + 1 : n), 0);
  }, [query]);

  const choose = (part: Part) => {
    selectAndFrame(part.id);
    setQuery('');
    setOpen(false);
    input.current?.blur();
  };

  return (
    <div className="relative w-full max-w-[280px]" dir="ltr">
      <div className="flex items-center gap-2 rounded-lg border border-edge bg-ink/70 px-2.5 focus-within:border-accent">
        <span className="select-none text-muted" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={input}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('');
              setOpen(false);
              input.current?.blur();
            }
            if (event.key === 'Enter' && results[0]) choose(results[0]);
          }}
          placeholder="Find a component"
          aria-label="Find a component by name or OEM item number"
          className="h-touch min-h-touch w-full bg-transparent font-mono text-[12px] text-text placeholder:text-muted focus:outline-none"
        />
        {query !== '' && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              input.current?.focus();
            }}
            aria-label="Clear search"
            className="shrink-0 px-1 font-mono text-sm text-muted hover:text-text"
          >
            ✕
          </button>
        )}
      </div>

      {open && query.trim() !== '' && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-lg border border-edge bg-panel shadow-lg shadow-black/30">
          {results.length === 0 ? (
            <p className="px-3 py-3 font-mono text-[11px] text-muted">No component matches.</p>
          ) : (
            <>
              <ul className="max-h-[46vh] overflow-y-auto">
                {results.map((part) => (
                  <li key={part.id}>
                    <button
                      type="button"
                      onClick={() => choose(part)}
                      className="flex min-h-touch w-full items-center gap-2 border-b border-edge/60 px-3 text-left last:border-b-0 hover:bg-ink/60"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            SYSTEMS.find((system) => system.id === part.system)?.color,
                        }}
                        aria-hidden="true"
                      />
                      <span className="w-[52px] shrink-0 font-mono text-[11px] text-accent">
                        {part.oem ?? '—'}
                      </span>
                      <span className="truncate text-[12px] text-text">{part.nameEn}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="border-t border-edge px-3 py-1.5 font-mono text-[10px] text-muted">
                {total} match{total === 1 ? '' : 'es'}
                {total > results.length ? ` · showing ${results.length}` : ''}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
