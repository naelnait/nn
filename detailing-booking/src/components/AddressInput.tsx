import { useEffect, useRef, useState } from 'react';
import { searchAddress, type AddressSuggestion } from '../lib/geocode';

interface Props {
  value: AddressSuggestion | null;
  onChange: (a: AddressSuggestion | null) => void;
  placeholder?: string;
  id?: string;
}

/** Champ d'adresse avec autocomplétion (adresses françaises). */
export function AddressInput({ value, onChange, placeholder, id }: Props) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  useEffect(() => {
    if (value && query === value.label) return;
    const t = setTimeout(async () => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      try {
        const res = await searchAddress(query, c.signal);
        setItems(res);
        setError('');
        setActive(-1);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError("Recherche d'adresse indisponible, réessayez.");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, value]);

  const pick = (a: AddressSuggestion) => {
    onChange(a);
    setQuery(a.label);
    setOpen(false);
    setItems([]);
  };

  return (
    <div className="address">
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-autocomplete="list"
        placeholder={placeholder ?? 'Numéro, rue, ville'}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
          if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active]); }
        }}
      />
      {open && items.length > 0 && (
        <ul className="address-list" role="listbox">
          {items.map((a, i) => (
            <li key={a.label + i} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); pick(a); }}>
              {a.label}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
