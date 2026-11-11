import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/resend";

// Fire-and-forget from the signup form: never blocks or fails a
// signup, since account creation already succeeded by the time this
// is called.
export async function POST(request: NextRequest) {
  const { name, email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }
  const result = await sendTemplateEmail("welcome", email, { name: name || "there" });
  return NextResponse.json(result);
}
