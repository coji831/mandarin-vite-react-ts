import "./ToggleSwitch.css";

export { ToggleSwitch };

function ToggleSwitch({
  label,
  checked,
  onChange,
  "aria-label": ariaLabel,
}: Readonly<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label"?: string;
}>) {
  return (
    <div className="toggle-switch flex-center gap-xs">
      <label className="switch inline-block">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel || label || undefined}
          className="op-0"
        />
        <span
          className={`slider round bg-primary-bg border-2 ${checked ? "border-primary" : "border-transparent"} hover:border-primary`}
        ></span>
        <span className="label-text" hidden>
          {label}
        </span>
      </label>
      {label && <span className="label">{label}</span>}
    </div>
  );
}
