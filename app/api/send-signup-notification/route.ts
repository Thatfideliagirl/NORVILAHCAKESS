import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/resend";

// Admin alert sent the moment a new customer creates an account -- mirrors
// send-order-notification, but for signups. Looks up the admin's
// notification email itself (server-side, via the service-role client),
// so the signup form doesn't need to fetch it.
export async function POST(request: NextRequest) {
  const { name, email, phone, location, howHeard } = await request.json();

  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ sent: false, reason: "supabase_not_configured" });
  }

  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("notification_email")
    .eq("id", true)
    .single();
  const adminEmail = settings?.notification_email;
  if (!adminEmail) {
    return NextResponse.json({ sent: false, reason: "no_notification_email" });
  }

  const result = await sendTemplateEmail("admin_new_signup", adminEmail, {
    customer_name: name || "",
    customer_email: email || "",
    customer_phone: phone || "",
    customer_location: location || "",
    how_heard: howHeard || "",
  });
  return NextResponse.json(result);
}
