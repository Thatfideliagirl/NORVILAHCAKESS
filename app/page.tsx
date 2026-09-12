import Hero from "@/components/Hero";
import CategoryStrip from "@/components/sections/CategoryStrip";
import BrandMoment from "@/components/sections/BrandMoment";
import ProcessSteps from "@/components/sections/ProcessSteps";
import PriceListSection from "@/components/sections/PriceListSection";
import CelebrationsSection from "@/components/sections/CelebrationsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FaqSection from "@/components/sections/FaqSection";
import FooterSection from "@/components/sections/FooterSection";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <CategoryStrip />
        <PriceListSection />
        <BrandMoment />
        <ProcessSteps />
        <CelebrationsSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <FooterSection />
    </>
  );
}
