import "server-only";

// Customer-facing emails (signup welcome, order confirmation), sent via
// Resend using templates the admin can edit in Admin -> Emails. Mirrors
// the EmailJS admin-alert pattern (lib/emailjs.ts): fire-and-forget,
// never throws into the caller -- a missing key or a failed send should
// never block a signup or an order from completing.
const API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL; // e.g. "Norvilah Cakes <hello@norvilahcakes.com>"

function render(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => tokens[key] ?? match);
}

export async function sendTemplateEmail(
  templateKey: "welcome" | "order_confirmation",
  to: string,
  tokens: Record<string, string>
): Promise<{ sent: boolean; reason?: string }> {
  if (!API_KEY || !FROM_ADDRESS) {
    console.warn(`Resend not configured -- skipping "${templateKey}" email.`);
    return { sent: false, reason: "not_configured" };
  }
  if (!to) {
    return { sent: false, reason: "no_recipient" };
  }

  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return { sent: false, reason: "supabase_not_configured" };
  }

  const { data: template, error } = await supabaseAdmin
    .from("email_templates")
    .select("subject, body")
    .eq("key", templateKey)
    .single();
  if (error || !template) {
    console.error(`Email template "${templateKey}" not found:`, error?.message);
    return { sent: false, reason: "template_not_found" };
  }

  const subject = render(template.subject, tokens);
  const text = render(template.body, tokens);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
    });
    if (!res.ok) {
      console.error(`Resend send failed for "${templateKey}":`, await res.text());
      return { sent: false, reason: "resend_error" };
    }
    return { sent: true };
  } catch (err) {
    console.error(`Resend send threw for "${templateKey}":`, err);
    return { sent: false, reason: "network_error" };
  }
}
