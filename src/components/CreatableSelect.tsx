import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
}

export default function CreatableSelect({ value, onChange, options, placeholder, id }: Props) {
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

  return (
    <div ref={ref} className="relative">
      <input
        id={id}
        type="text"
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
      {open && (filtered.length > 0 || (query && !options.includes(query))) && (
        <ul className="absolute z-50 w-full mt-1 bg-card border border-stroke rounded shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={() => select(o)}
              className="px-3 py-2 text-sm text-ink cursor-pointer hover:bg-thead"
            >
              {o}
            </li>
          ))}
          {query && !options.includes(query) && (
            <li
              onMouseDown={() => select(query)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-thead text-accent italic"
            >
              Create "{query}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
