import "./ToggleSwitch.css";

export { ToggleSwitch };

function ToggleSwitch({
  label,
  checked,
  onChange,
}: Readonly<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>) {
  return (
    <div className="toggle-switch">
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider round"></span>
        <span className="label-text" hidden>
          {label}
        </span>
      </label>
      {label && <span className="label">{label}</span>}
    </div>
  );
}
