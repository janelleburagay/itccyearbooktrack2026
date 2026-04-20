export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="YearbookTrack logo"
    >
      {/* Book shape */}
      <rect x="6" y="6" width="28" height="32" rx="3" fill="currentColor" opacity="0.15" />
      <rect x="6" y="6" width="13" height="32" rx="3" fill="currentColor" opacity="0.25" />
      <rect x="8" y="8" width="9" height="28" rx="2" fill="currentColor" opacity="0.4" />
      {/* Pages */}
      <line x1="21" y1="12" x2="31" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="21" y1="17" x2="31" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="21" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Check mark */}
      <circle cx="30" cy="30" r="8" fill="currentColor" />
      <path d="M26.5 30 L29 32.5 L33.5 27.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
