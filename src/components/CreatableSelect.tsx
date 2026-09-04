import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  onCreate?: (val: string) => void; // called only when the Create row is clicked
  onDelete?: (val: string) => void; // enables the cross on saved descriptions
}

export default function CreatableSelect({ value, onChange, options, placeholder, id, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (!query) onChange('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [query, onChange]);

  function select(val: string) {
    onChange(val);
    setQuery(val);
    setOpen(false);
  }

  // Create row
  function create(val: string) {
    onCreate?.(val.trim());
    select(val.trim());
  }

  function remove(e: React.MouseEvent, val: string) {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(val);
  }

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        className="w-full bg-subtle border border-stroke rounded px-3 py-2 text-sm text-ink placeholder:text-ink-ghost focus:outline-none focus:border-accent"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtered.length > 0 || (query.trim() && !options.includes(query.trim()))) && (
        <ul className="absolute z-50 w-full mt-1 bg-card border border-stroke rounded shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={() => select(o)}
              className="group flex items-center justify-between gap-2 px-3 py-2 text-sm text-ink cursor-pointer hover:bg-thead"
            >
              <span className="truncate">{o}</span>
              {onDelete && (
                <button
                  type="button"
                  onMouseDown={(e) => remove(e, o)}
                  className="flex-shrink-0 text-ink-ghost opacity-0 group-hover:opacity-100 hover:text-danger transition-all"
                  aria-label={`Remove ${o}`}
                  title="Remove label"
                >
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
          {query.trim() && !options.includes(query.trim()) && (
            <li
              onMouseDown={() => create(query)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-thead text-accent italic"
            >
              Create "{query.trim()}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
