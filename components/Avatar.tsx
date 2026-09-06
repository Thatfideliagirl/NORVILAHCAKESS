import Image from "next/image";

function initialsFor(name: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Avatar({
  url,
  name,
  size = 40,
}: {
  url: string | null;
  name: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-plaster/40"
        style={{ width: size, height: size }}
      >
        <Image src={url} alt={name ?? "Avatar"} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-berry font-display font-semibold text-cream"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsFor(name)}
    </div>
  );
}
