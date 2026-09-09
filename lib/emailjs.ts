import emailjs from "@emailjs/browser";

// Admin alert emails only -- notifies Norvilah when a new order or
// inquiry comes in. Never blocks the order/inquiry flow itself: every
// call here is fire-and-forget from the caller's point of view, so a
// missing key or a failed send never stops a customer's order or
// inquiry from going through.
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const ORDER_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_ORDER_TEMPLATE_ID;
const INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID;

function send(templateId: string | undefined, params: Record<string, string>) {
  if (!PUBLIC_KEY || !SERVICE_ID || !templateId) {
    console.warn("EmailJS not fully configured -- skipping admin alert email.");
    return;
  }
  emailjs.send(SERVICE_ID, templateId, params, { publicKey: PUBLIC_KEY }).catch((error) => {
    console.error("Failed to send admin alert email:", error);
  });
}

export function sendOrderAlert(params: {
  to_email: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_items: string;
  order_total: string;
  delivery_location: string;
  order_channel: string;
  payment_method: string;
}) {
  if (!params.to_email) {
    console.warn("No notification email set in Admin Settings -- skipping order alert email.");
    return;
  }
  send(ORDER_TEMPLATE_ID, params);
}

export function sendInquiryAlert(params: {
  to_email: string;
  customer_name: string;
  customer_phone: string;
  event_date: string;
  inquiry_message: string;
}) {
  if (!params.to_email) {
    console.warn("No notification email set in Admin Settings -- skipping inquiry alert email.");
    return;
  }
  send(INQUIRY_TEMPLATE_ID, params);
}
