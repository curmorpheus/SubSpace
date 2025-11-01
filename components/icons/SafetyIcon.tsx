export function SafetyIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Safety vest"
    >
      {/* Safety vest icon - simple, clean lines inspired by SF Symbols */}
      <path
        d="M12 3L8 5.5V8L6 10V21H18V10L16 8V5.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Reflective stripe */}
      <line
        x1="6"
        y1="13"
        x2="18"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* V-neck detail */}
      <path
        d="M12 3V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
