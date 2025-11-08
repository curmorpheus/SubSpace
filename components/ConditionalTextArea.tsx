"use client";

interface ConditionalTextAreaProps {
  show: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  maxLength?: number;
}

export default function ConditionalTextArea({
  show,
  value,
  onChange,
  placeholder = "Add additional comments (optional)...",
  label,
  maxLength = 500,
}: ConditionalTextAreaProps) {
  if (!show) return null;

  return (
    <div className="mt-3 ml-4 animate-fadeIn">
      {label && (
        <label className="block text-sm font-medium text-gray-600 mb-2">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none text-gray-900 placeholder-gray-400"
      />
      <div className="text-right text-xs text-gray-500 mt-1">
        {value.length}/{maxLength} characters
      </div>
    </div>
  );
}
