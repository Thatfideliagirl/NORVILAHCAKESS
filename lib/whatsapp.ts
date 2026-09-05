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

export type EnquiryFormData = {
  name: string;
  phone: string;
  email: string;
  details: string;
  occasion: Occasion | null;
};

// Turns the on-site enquiry form into the WhatsApp message. Phase 2/3:
// this same form data should also be POSTed to the backend so the
// enquiry is stored and shows up as a notification when the owner logs
// into her account — there's no server yet, so for now the only place
// the enquiry goes is this WhatsApp message.
export function buildEnquiryMessageFromForm(data: EnquiryFormData): string {
  const label = data.occasion ? occasionLabel(data.occasion).toLowerCase() : "general";
  const lines = [
    `Hi Norvilah, I would like to enquire about a ${label} order.`,
    `Name: ${data.name}`,
    `WhatsApp number: ${data.phone}`,
  ];
  if (data.email.trim()) {
    lines.push(`Email: ${data.email}`);
  }
  lines.push(`Details: ${data.details}`);
  return lines.join("\n");
}

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
