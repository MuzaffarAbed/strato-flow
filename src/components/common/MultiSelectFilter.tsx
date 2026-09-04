import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiX } from 'react-icons/fi';

export interface MultiSelectOption {
  id: number;
  name: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  allLabel?: string;
  className?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  allLabel = 'All',
  className = '',
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node))
        setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedNames = useMemo(
    () => options.filter((option) => value.includes(option.id)).map((option) => option.name),
    [options, value],
  );

  const summary = selectedNames.length === 0
    ? allLabel
    : selectedNames.length <= 2
      ? selectedNames.join(', ')
      : `${selectedNames.length} selected`;

  const toggle = (id: number) => {
    onChange(
      value.includes(id)
        ? value.filter((current) => current !== id)
        : [...value, id],
    );
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:border-primary"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className={`truncate ${selectedNames.length === 0 ? 'text-gray-500' : ''}`}>{summary}</span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedNames.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange([]);
                }
              }}
              className="p-0.5 text-gray-400 hover:text-gray-700"
              aria-label={`Clear ${label}`}
            >
              <FiX className="w-3.5 h-3.5" />
            </span>
          )}
          <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto">
          <div className="sticky top-0 bg-card border-b border-border px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">{label}</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="p-2 space-y-1" role="listbox" aria-multiselectable="true">
            {options.map((option) => {
              const checked = value.includes(option.id);
              return (
                <label
                  key={option.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-border/40 ${
                    checked ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.id)}
                    className="rounded border-border accent-primary"
                  />
                  <span>{option.name}</span>
                </label>
              );
            })}
            {options.length === 0 && (
              <p className="px-2 py-3 text-xs text-gray-500 text-center">No options</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
