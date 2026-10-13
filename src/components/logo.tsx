export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M3 20c4 0 5-6 9-6s5 6 9 6 4-3 5-4" fill="none" stroke="var(--ecume)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="27.5" cy="15.5" r="2.6" fill="var(--balise)" />
    </svg>
  );
}
