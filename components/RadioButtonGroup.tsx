"use client";

import { useState } from "react";

interface RadioButtonGroupProps {
  label: string;
  value: "Yes" | "No" | "N/A" | "";
  onChange: (value: "Yes" | "No" | "N/A") => void;
  required?: boolean;
  helperText?: string;
  name: string; // For accessibility
}

export default function RadioButtonGroup({
  label,
  value,
  onChange,
  required = false,
  helperText,
  name,
}: RadioButtonGroupProps) {
  const options: Array<"Yes" | "No" | "N/A"> = ["Yes", "No", "N/A"];

  const getButtonStyles = (option: "Yes" | "No" | "N/A") => {
    const isSelected = value === option;
    const baseStyles = "flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2";

    if (isSelected) {
      // Selected state - orange background
      return `${baseStyles} bg-orange-500 text-white border-2 border-orange-500 shadow-md`;
    }

    // Unselected state - white background with gray border
    return `${baseStyles} bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-300 hover:bg-orange-50`;
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {helperText && (
        <p className="text-sm text-gray-600 mb-3">{helperText}</p>
      )}

      <div className="flex gap-3" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={getButtonStyles(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
