import Arch from "@/components/Arch";

const HEADING_LINE_1 = "Good Food";
const HEADING_LINE_2 = "Brings People Together.";
const PARAGRAPH =
  "At Norvilah Cakes, we believe the best moments are often shared over something delicious. From everyday cravings to special celebrations, we make every treat fresh, with quality ingredients and a whole lot of love.";

// A quiet editorial pause between "What are you craving?" and the
// process steps, per the client's own written spec: no icons, no
// stats, generous whitespace, the photo as one integrated element
// rather than a full-bleed backdrop.
export default function BrandMoment() {
  return (
    <section className="bg-cream py-24 md:py-40">
      <div className="mx-auto grid max-w-content items-center gap-12 px-6 md:grid-cols-2 md:gap-12 lg:gap-20">
        <div className="order-2 md:order-1">
          <p className="inline-block w-fit rounded-pill bg-rose/60 px-4 py-1.5 font-body text-small uppercase tracking-[0.12em] text-berry">
            A little about Norvilah
          </p>
          <h2 className="mt-4 font-display text-heading leading-[1.05] text-ink">
            {HEADING_LINE_1}
            <br />
            {HEADING_LINE_2}
          </h2>
          <p className="measure mt-6 font-body text-lead text-ink/75">
            {PARAGRAPH}
          </p>
        </div>

        <div className="order-1 md:order-2 md:-mr-6 lg:-mr-11">
          <Arch
            src="/brand-section.jpg"
            alt="A hand piping pink frosting onto a cupcake, with strawberries and white flowers alongside."
            sizes="(min-width: 768px) 480px, 90vw"
            className="mx-auto w-full max-w-sm md:max-w-none"
            imageClassName="object-[58%_32%]"
          />
        </div>
      </div>
    </section>
  );
}
