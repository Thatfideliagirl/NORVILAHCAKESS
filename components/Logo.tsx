import Image from "next/image";

// The Fraunces wordmark stays the primary mark (it matches the site's
// premium editorial type direction); the client's actual cupcake icon
// sits beside it as a small brand accent, recoloured from the source
// orange to berry so it doesn't fight the dusty-pink palette.
export default function Logo({ textClassName }: { textClassName: string }) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/logo-icon.png"
        alt=""
        width={40}
        height={18}
        className="h-6 w-auto md:h-7"
        aria-hidden="true"
      />
      <span className={`font-display ${textClassName}`}>Norvilah Cakes</span>
    </span>
  );
}
