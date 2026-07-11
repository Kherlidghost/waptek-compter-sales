import { NextResponse } from "next/server";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { sendMarketplaceEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Only admin users can send test emails." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { to?: string; subject?: string; html?: string; text?: string } | null;
  if (!body?.to || !body.subject || !body.html) {
    return NextResponse.json({ error: "to, subject, and html are required." }, { status: 400 });
  }

  const result = await sendMarketplaceEmail({
    to: body.to,
    subject: body.subject,
    html: body.html,
    text: body.text,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

