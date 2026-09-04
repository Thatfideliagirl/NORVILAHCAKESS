const WHATSAPP_NUMBER = "2348166603466";

// The occasion chips in the section 5 celebrations enquiry. Phase 2
// adds a second, broader taxonomy for enquiry entry points elsewhere on
// the site (custom cake, bulk or corporate, small chops, event order,
// general) — this type only covers what the landing page needs today.
export type Occasion =
  | "birthday"
  | "date-night"
  | "party"
  | "corporate-event"
  | "girls-hangout"
  | "just-because";

export const OCCASIONS: { id: Occasion; label: string }[] = [
  { id: "birthday", label: "Birthday" },
  { id: "date-night", label: "Date night" },
  { id: "party", label: "Party" },
  { id: "corporate-event", label: "Corporate event" },
  { id: "girls-hangout", label: "Girls hangout" },
  { id: "just-because", label: "Just because" },
];

function occasionLabel(occasion: Occasion): string {
  return OCCASIONS.find((o) => o.id === occasion)?.label ?? "general";
}

export function buildEnquiryMessage(occasion: Occasion | null): string {
  if (!occasion) {
    return "Hi Norvilah, I would like to make a general enquiry.";
  }

  const label = occasionLabel(occasion).toLowerCase();
  return [
    `Hi Norvilah, I would like to enquire about a ${label} order.`,
    "Date needed:",
    "Number of guests:",
    "Budget range:",
    "Anything specific:",
  ].join("\n");
}

export function buildWhatsAppEnquiryLink(occasion: Occasion | null): string {
  const message = buildEnquiryMessage(occasion);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
