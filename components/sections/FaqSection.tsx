import AccordionItem from "@/components/Accordion";

// Answers are placeholders pending real copy from the client, except
// the delivery question, which uses the fee schedule given in the
// brief section 7.
const FAQS: { question: string; answer: string }[] = [
  {
    question: "How far in advance should I place an order?",
    // TODO(client): confirm real lead times per product category.
    answer:
      "We recommend ordering at least 48 hours ahead for most treats, and a week or more for celebration cakes and large event orders.",
  },
  {
    question: "Where do you deliver?",
    answer:
      "We deliver across Lagos. Egbeda is ₦2,200, Ikotun is ₦2,700, and Ijegun is ₦3,000. Other areas are available on request.",
  },
  {
    question: "Do you cater for events?",
    // TODO(client): confirm real minimum order sizes and lead time for events.
    answer:
      "Yes. We cater for birthdays, parties and corporate events, with custom menus and quantities built around your event.",
  },
  {
    question: "What payment methods do you accept?",
    // TODO(client): confirm accepted payment methods.
    answer:
      "We currently accept bank transfer, with more payment options coming as the site grows.",
  },
  {
    question: "Can I make a custom order?",
    // TODO(client): confirm custom order process and lead time.
    answer:
      "Yes. Message us on WhatsApp with what you have in mind, and we will work out the details together.",
  },
  {
    question: "Can I pick up my order?",
    // TODO(client): confirm pickup location and hours.
    answer:
      "Yes, pickup is available. We will share the address and a pickup time once your order is confirmed.",
  },
];

export default function FaqSection() {
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
