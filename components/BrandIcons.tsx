// lucide-react dropped brand marks a while back, and the brief asks for
// no icon library heavier than lucide, so Instagram and WhatsApp are two
// small hand-drawn outlines here, matching lucide's own stroke
// conventions (24px viewBox, round caps, 1.5 stroke). TikTok uses
// lucide's Music2 as a stand-in, labelled for screen readers.
type IconProps = { className?: string; strokeWidth?: number };

export function InstagramIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function WhatsAppIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 21l1.3-4.2A8 8 0 1 1 8.6 20L4 21z" />
      <path d="M8.5 9.5c0 3.5 2.5 6 6 6 .8 0 1.2-.9.7-1.5l-1-1.2c-.3-.3-.7-.4-1-.2l-.7.4a4.7 4.7 0 0 1-2.5-2.5l.4-.7c.2-.3.1-.7-.2-1L9 7.8c-.6-.5-1.5-.1-1.5.7z" />
    </svg>
  );
}
