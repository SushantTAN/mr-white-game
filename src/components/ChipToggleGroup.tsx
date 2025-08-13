type Option = { value: number; label?: string; recommended?: boolean };

type Props = {
  value: number;
  options: Option[];
  onChange: (v: number) => void;
  ariaLabel?: string;
};

export default function ChipToggleGroup({ value, options, onChange, ariaLabel }: Props) {
  return (
    <div className="chips" role="radiogroup" aria-label={ariaLabel ?? "Select an option"}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            className={`chip ${active ? "active" : ""}`}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            title={opt.recommended ? "Recommended" : undefined}
          >
            {opt.label ?? opt.value}
            {opt.recommended && <span className="chip-badge">★</span>}
          </button>
        );
      })}
    </div>
  );
}
