"use client";

import AccordionItem from "@/components/Accordion";
import { useStorefrontFaqs } from "@/lib/supabase/storefront-faqs";

export default function FaqSection() {
  const FAQS = useStorefrontFaqs();
  return (
    <section id="questions" className="relative bg-rose/15 pb-24 pt-28 md:pb-32 md:pt-32">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-10 w-full -translate-y-full text-rose/15 md:h-14"
      >
        <path
          fill="currentColor"
          d="M0,32 C240,72 480,0 720,20 C960,40 1200,72 1440,24 L1440,60 L0,60 Z"
        />
      </svg>

      <div className="mx-auto max-w-content px-6 text-center">
        <h2 className="font-display text-subheading text-berry">
          Questions, before you order
        </h2>
      </div>

      <div className="mx-auto mt-12 flex max-w-[720px] flex-col gap-4 px-6">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.question} question={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
