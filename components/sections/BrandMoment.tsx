import Image from "next/image";
import { Clock, Heart, Leaf, PartyPopper } from "lucide-react";
import ScriptAccent from "@/components/ScriptAccent";

const MARKS = [
  { icon: Leaf, label: "Quality ingredients" },
  { icon: Clock, label: "Made fresh to order" },
  { icon: PartyPopper, label: "Perfect for all occasions" },
  { icon: Heart, label: "Loved by many" },
];

const HEADING = "Good food brings people together.";
const PARAGRAPH =
  "Every treat tells a story. Celebrations, small wins, and the everyday moments that matter. We make cakes, desserts and savoury bites with quality ingredients, care, and a whole lot of love.";

function Marks() {
  return (
    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-5">
      {MARKS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex w-24 flex-col items-start gap-2">
          <Icon className="size-6 text-clay" strokeWidth={1.5} />
          <span className="font-body text-small text-ink">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function BrandMoment() {
  return (
    <section className="bg-cream">
      {/* Mobile: image on top, text stacked below on plaster. */}
      <div className="relative aspect-[4/5] w-full md:hidden">
        <Image
          src="/brand-section-mobile.jpg"
          alt="A hand piping pink frosting onto a cupcake, with strawberries and white flowers alongside."
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="bg-plaster px-6 py-16 md:hidden">
        <h2 className="font-display text-heading text-berry">{HEADING}</h2>
        <p className="measure mt-4 font-body text-lead text-ink">{PARAGRAPH}</p>
        <Marks />
      </div>

      {/* Desktop: full bleed, text sits directly on the photographed wall. */}
      <div className="relative hidden aspect-video w-full md:block">
        <Image
          src="/brand-section.jpg"
          alt="A hand piping pink frosting onto a cupcake against a sunlit plaster wall."
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-y-0 left-0 flex w-1/3 flex-col justify-center px-6 lg:px-11">
          <h2 className="font-display text-heading text-berry">{HEADING}</h2>
          <p className="measure mt-4 font-body text-lead text-ink">{PARAGRAPH}</p>
          <Marks />
        </div>
        <ScriptAccent
          text="Baked with love, always"
          rotate={-4}
          color="text-cream/80"
          className="pointer-events-none absolute bottom-8 right-8 w-64 lg:w-80"
        />
      </div>
    </section>
  );
}
