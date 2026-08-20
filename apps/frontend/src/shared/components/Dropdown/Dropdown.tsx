/**
 * Dropdown Component
 *
 * Custom controlled dropdown that renders options as visible DOM elements,
 * avoiding native `<select>` overlay issues on dark themes.
 *
 * Usage:
 * ```tsx
 * <Dropdown
 *   value={filter.strokeCount}
 *   onChange={(val) => setFilter({ strokeCount: val })}
 *   options={[
 *     { value: null, label: "All strokes" },
 *     { value: 1, label: "1 stroke" },
 *   ]}
 *   placeholder="All strokes"
 *   label="Stroke count"
 *   id="radicals-stroke-count"
 * />
 * ```
 */

import { useState, useRef, useEffect, useCallback } from "react";
import "./Dropdown.css";

export interface DropdownOption<TValue = string | number | null> {
  value: TValue;
  label: string;
}

export interface DropdownProps<TValue = string | number | null> {
  value: TValue;
  onChange: (value: TValue) => void;
  options: DropdownOption<TValue>[];
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export function Dropdown<TValue = string | number | null>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  id,
  className = "",
  ariaLabel,
}: DropdownProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (option: DropdownOption<TValue>) => {
      onChange(option.value);
      setIsOpen(false);
    },
    [onChange],
  );

  // Close on Escape, open on Enter/Space
  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [handleToggle],
  );

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, option: DropdownOption<TValue>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect(option);
      }
    },
    [handleSelect],
  );

  const dropdownId = id || `dropdown-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const listboxId = `${dropdownId}-listbox`;

  return (
    <div ref={containerRef} className={`dropdown relative flex-col gap-xs ${className}`.trim()}>
      {label && (
        <label
          htmlFor={dropdownId}
          className="dropdown__label font-xs text-secondary text-uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <button
        id={dropdownId}
        type="button"
        className="dropdown__trigger focus-ring flex-center flex-between w-full text-primary font-lg p-sm radius-md cursor-pointer bg-surface-light-5 border-1 border-surface transition-all hover:border-primary-border focus:border-primary"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || label}
        aria-controls={listboxId}
      >
        <span className="dropdown__trigger-text flex-1 whitespace-nowrap overflow-hidden">
          {displayText}
        </span>
        <span
          className={`dropdown__arrow font-xs text-muted lh-1 ${isOpen ? "dropdown__arrow--open" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <ul
          id={listboxId}
          className="dropdown__menu m-0 border-1 border-surface radius-md bg-surface-dark-alt shadow-elevated-2 p-xs absolute"
          role="listbox"
          aria-label={label || ariaLabel}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const optionId = `${dropdownId}-option-${index}`;
            return (
              <li
                key={String(option.value ?? "null")}
                id={optionId}
                role="option"
                aria-selected={isSelected}
                className={`dropdown__option text-primary font-sm cursor-pointer p-sm ${isSelected ? "dropdown__option--selected bg-primary-bg text-accent fw-600" : ""}`}
                onClick={() => handleSelect(option)}
                onKeyDown={(e) => handleOptionKeyDown(e, option)}
                tabIndex={0}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
