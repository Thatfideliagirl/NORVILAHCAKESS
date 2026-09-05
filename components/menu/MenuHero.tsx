import Image from "next/image";

// Minimal by design, per the client's explicit menu-page spec: eyebrow,
// heading, a photo from the same visual world as the homepage hero. No
// icons, no quotes, no badges.
export default function MenuHero() {
  return (
    <section className="relative overflow-hidden bg-plaster pt-24 md:pt-28">
      <div className="relative mx-auto flex max-w-content flex-col items-start px-6 py-16 md:flex-row md:items-center md:gap-12 md:py-20 lg:px-11">
        <div className="relative z-10">
          <p className="font-body text-small uppercase tracking-[0.12em] text-clay">
            Our Menu
          </p>
          <h1 className="mt-4 font-display text-heading leading-[1.05] text-berry">
            Freshly Made
            <br />
            Just for You.
          </h1>
          <span aria-hidden="true" className="mt-6 block h-[3px] w-16 bg-berry" />
        </div>

        <div className="relative mt-10 aspect-[4/3] w-full overflow-hidden rounded-panel md:mt-0 md:aspect-[16/10] md:flex-1">
          <Image
            src="/hero-still.jpg"
            alt="A parfait, cupcake and waffles arranged on a flour-dusted wooden table."
            fill
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
