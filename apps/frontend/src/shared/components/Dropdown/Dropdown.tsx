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
    <div ref={containerRef} className={`dropdown ${className}`.trim()}>
      {label && (
        <label htmlFor={dropdownId} className="dropdown__label">
          {label}
        </label>
      )}
      <button
        id={dropdownId}
        type="button"
        className="dropdown__trigger"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || label}
        aria-controls={listboxId}
      >
        <span className="dropdown__trigger-text">{displayText}</span>
        <span
          className={`dropdown__arrow ${isOpen ? "dropdown__arrow--open" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <ul
          id={listboxId}
          className="dropdown__menu"
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
                className={`dropdown__option ${isSelected ? "dropdown__option--selected" : ""}`}
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
