// Champ texte avec suggestions locales (marques, modèles). La saisie libre reste possible.
import { useState } from 'react';
import { searchList, vehicleKey } from '../lib/vehicles';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
  emptyHint?: string;
  /** Libellé au-dessus du champ (formulaires de l'espace pro) au lieu du libellé flottant. */
  plain?: boolean;
  /** Saisie reconnue (marque ou modèle du catalogue, y compris variantes) : affiche une coche, pas d'avertissement. */
  isKnown?: (v: string) => boolean;
}

export function Combo({ id, label, value, onChange, options, disabled, required, emptyHint, plain, isKnown }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // La saisie exacte reste dans la liste : elle n'est retirée que si c'est la seule suggestion
  const found = searchList(options, value, 8);
  const exact = found.some((o) => vehicleKey(o.label) === vehicleKey(value));
  const items = exact && found.length === 1 ? [] : found;
  const known = value.trim().length > 0 && (exact || !!isKnown?.(value));

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className={plain ? 'combo plain' : 'field combo'}>
      {plain && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        placeholder=" "
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-autocomplete="list"
        aria-controls={`${id}-list`}
        required={required}
        disabled={disabled}
        maxLength={60}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
          if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active].label); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {!plain && <label htmlFor={id}>{label}</label>}
      {open && !disabled && items.length > 0 && (
        <ul className="address-list" id={`${id}-list`} role="listbox">
          {items.map((o, i) => (
            <li key={o.key} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); pick(o.label); }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
      {known && !plain && <span className="combo-ok" aria-label="Reconnu">✓</span>}
      {open && !disabled && !known && value.trim().length > 0 && items.length === 0 && emptyHint && <p className="fine">{emptyHint}</p>}
    </div>
  );
}
