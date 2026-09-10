"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Faq = { question: string; answer: string };

const FALLBACK: Faq[] = [
  {
    question: "How far in advance should I place an order?",
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
    answer:
      "Yes. We cater for birthdays, parties and corporate events, with custom menus and quantities built around your event.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We currently accept bank transfer, with more payment options coming as the site grows.",
  },
  {
    question: "Can I make a custom order?",
    answer: "Yes. Message us on WhatsApp with what you have in mind, and we will work out the details together.",
  },
  {
    question: "Can I pick up my order?",
    answer: "Yes, pickup is available. We will share the address and a pickup time once your order is confirmed.",
  },
];

// Admin's FAQ page has always managed a database table, but the
// landing page kept reading a hardcoded list -- exactly the same
// disconnect categories/products had. The static list above is now
// only a fallback shown until the real (active) rows load.
export function useStorefrontFaqs(): Faq[] {
  const [faqs, setFaqs] = useState<Faq[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("faqs")
      .select("question, answer")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setFaqs(data);
      });
  }, []);

  return faqs;
}
