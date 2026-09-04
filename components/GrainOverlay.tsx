// A single fine-grain texture laid over the whole page so the video,
// the photography and the flat colour sections read as one material
// instead of three different surfaces. Rendered once, fixed, and never
// intercepts a click.
export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-multiply"
    >
      <svg width="100%" height="100%">
        <filter id="norvilah-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#norvilah-grain)" />
      </svg>
    </div>
  );
}
