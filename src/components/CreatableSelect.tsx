/**
 * Creatable select
 *
 * Text input field with a filtered suggestion list, optional create and delete functionality
 * Delete is enabled by a hold on touch on mobile and by hover over a cross on desktop
 *
 */

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  onCreate?: (val: string) => void; // adds the Create row, called when it is clicked
  onDelete?: (val: string) => void; // enables delete, cross on desktop and hold on touch
}

// Hold time to open the delete confirm
const HOLD_MS = 500;

export default function CreatableSelect({ value, onChange, options, placeholder, id, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [confirming, setConfirming] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const held = useRef(false);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );
  const canCreate = !!onCreate && query.trim() !== '' && !options.includes(query.trim());

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close the list on a click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(null);
        if (!query) onChange('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [query, onChange]);

  // Select entry from dropdown
  function select(val: string) {
    onChange(val);
    setQuery(val);
    setOpen(false); // close list after selection
    setConfirming(null);
  }

  // Create new label entry
  function create(val: string) {
    onCreate?.(val.trim());
    select(val.trim());
  }

  // Delete saved label via hover
  function remove(e: React.MouseEvent, val: string) {
    e.stopPropagation();
    onDelete?.(val);
  }

  // Start a delete hold on touch
  function startHold(e: React.PointerEvent, val: string) {
    held.current = false;
    if (!onDelete || e.pointerType !== 'touch') return;
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      setConfirming(val);
    }, HOLD_MS);
  }

  // Cancel the hold timer
  function cancelHold() {
    window.clearTimeout(holdTimer.current);
  }

  // Select entry on tap, skipped after a hold
  function handleRowClick(val: string) {
    if (held.current) {
      held.current = false;
      return;
    }
    select(val);
  }

  // Delete saved entry via hold after the confirm
  function confirmDelete(val: string) {
    onDelete?.(val);
    setConfirming(null);
  }

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        className="w-full bg-subtle border border-stroke rounded px-3 py-2 text-base md:text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtered.length > 0 || canCreate) && (
        <ul className="absolute z-50 w-full mt-1 bg-card border border-stroke rounded shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((o) =>
            confirming === o ? (
              <li key={o} className="flex items-center justify-between gap-2 px-3 py-3 text-sm bg-thead">
                {/* Delete confirm, opened by a hold */}
                <span className="truncate text-ink">Delete "{o}"?</span>
                <span className="flex gap-4 flex-shrink-0 font-medium">
                  <button type="button" onClick={() => confirmDelete(o)} className="text-danger">Yes</button>
                  <button type="button" onClick={() => setConfirming(null)} className="text-ink-muted">No</button>
                </span>
              </li>
            ) : (
              <li
                key={o}
                onClick={() => handleRowClick(o)}
                onPointerDown={(e) => startHold(e, o)}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onContextMenu={(e) => { if (onDelete) e.preventDefault(); }}
                className="group flex items-center justify-between gap-2 px-3 py-2 pointer-coarse:py-3 text-sm text-ink cursor-pointer select-none hover:bg-thead"
              >
                <span className="truncate">{o}</span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => remove(e, o)}
                    className="flex-shrink-0 text-ink-ghost opacity-0 group-hover:opacity-100 pointer-coarse:hidden hover:text-danger transition-all"
                    aria-label={`Remove ${o}`}
                    title="Remove label"
                  >
                    <X size={13} />
                  </button>
                )}
              </li>
            )
          )}
          {canCreate && (
            <li
              onClick={() => create(query)}
              className="px-3 py-2 pointer-coarse:py-3 text-sm cursor-pointer hover:bg-thead text-accent italic"
            >
              Create "{query.trim()}"
            </li>
          )}
          {/* Touch hint */}
          {onDelete && filtered.length > 0 && (
            <li className="hidden pointer-coarse:block px-3 py-2 text-xs text-ink-faint">
              Hold a label to delete it
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
