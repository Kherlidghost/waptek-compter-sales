import { NextResponse } from "next/server";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type StaffRequest = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: "manager" | "cashier";
  branch_id?: string;
  temporary_password?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Only admin users can create staff accounts." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as StaffRequest | null;
  const fullName = body?.full_name?.trim() ?? "";
  const email = body?.email?.trim().toLowerCase() ?? "";
  const role = body?.role;
  const branchId = body?.branch_id?.trim() ?? "";
  const password = body?.temporary_password ?? "";

  if (!fullName || !email || !branchId || !password || (role !== "manager" && role !== "cashier")) {
    return NextResponse.json({ error: "Full name, email, role, branch, and temporary password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required as a server-only Vercel Production environment variable." },
      { status: 500 },
    );
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone: body?.phone ?? null,
      role,
    },
  });

  if (createError || !data.user) {
    return NextResponse.json({ error: createError?.message ?? "Could not create staff Auth user." }, { status: 502 });
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullName,
      phone: body?.phone ?? null,
      role,
      branch_id: branchId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 502 });
  }

  return NextResponse.json({ id: data.user.id, email, role });
}

