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
    <section id="questions" className="bg-cream py-24 md:py-40">
      <div className="mx-auto max-w-content px-6 text-center">
        <h2 className="font-display text-subheading text-berry">
          Questions, before you order
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-[720px] px-6">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.question} question={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
