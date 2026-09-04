import Image from "next/image";

// The one arch shape used everywhere on the site: a rectangle whose top
// is a perfect semicircle (see .arch in globals.css). Purely
// presentational — callers add their own hover/interaction behaviour.
export default function Arch({
  src,
  alt,
  sizes,
  priority,
  imageClassName,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  imageClassName?: string;
  className?: string;
}) {
  return (
    <div className={`arch relative ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${imageClassName ?? ""}`}
      />
    </div>
  );
}
