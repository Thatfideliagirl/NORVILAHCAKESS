"use client";

import { useId, useState } from "react";
import {
  buildEnquiryMessageFromForm,
  buildWhatsAppLink,
  type Occasion,
} from "@/lib/whatsapp";

const inputClasses =
  "w-full rounded-panel border border-plaster/30 bg-transparent px-4 py-3 font-body text-body text-plaster placeholder:text-plaster/50 focus-visible:border-plaster";

export default function EnquiryForm({ occasion }: { occasion: Occasion | null }) {
  const formId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = buildEnquiryMessageFromForm({
      name,
      phone,
      email,
      details,
      occasion,
    });
    window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor={`${formId}-name`} className="sr-only">
          Your name
        </label>
        <input
          id={`${formId}-name`}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputClasses}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${formId}-phone`} className="sr-only">
            WhatsApp number
          </label>
          <input
            id={`${formId}-phone`}
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number"
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor={`${formId}-email`} className="sr-only">
            Email address (optional)
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address (optional)"
            className={inputClasses}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${formId}-details`} className="sr-only">
          What do you need?
        </label>
        <textarea
          id={`${formId}-details`}
          required
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Date needed, number of guests, budget, anything specific"
          className={`${inputClasses} resize-none`}
        />
      </div>
      <button
        type="submit"
        className="self-start rounded-pill bg-plaster px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-cream"
      >
        Send enquiry
      </button>
    </form>
  );
}
