/**
 * RadioGroup Component — Generic radio button group
 *
 * A controlled radio button group with horizontal/vertical layout.
 * No business domain dependencies.
 */
import "./RadioGroup.css";

export type RadioOption = { value: string; label: string; disabled?: boolean };

export type RadioGroupProps = {
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  layout?: "horizontal" | "vertical";
  label?: string;
};

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  layout = "vertical",
  label,
}: RadioGroupProps) {
  return (
    <fieldset className={`radio-group m-0 radio-group--${layout} border-none gap-xs flex-wrap p-0`}>
      {label && (
        <legend className="radio-group__label font-sm text-tertiary w-full p-0">{label}</legend>
      )}
      {options.map((opt) => {
        const id = `${name}-${opt.value}`;
        return (
          <label
            key={opt.value}
            className={`radio-group__option gap-xs p-xs border-1 border-surface radius-md cursor-pointer transition-all ${value === opt.value ? "bg-primary-bg border-primary" : ""} ${opt.disabled ? "radio-group__option--disabled op-40" : "hover:border-primary"}`}
            htmlFor={id}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={opt.disabled}
              className="radio-group__input op-0"
            />
            <span
              className={`radio-group__custom-radio flex-center radius-full transition-all shrink-0 border-2 border-surface ${value === opt.value ? "border-primary" : ""}`}
              aria-hidden="true"
            />
            <span className="radio-group__option-label font-sm text-secondary">{opt.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
