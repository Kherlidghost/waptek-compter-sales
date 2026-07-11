"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function adminSetupMessage() {
  return "Staff account actions require a server-only Supabase admin key on Vercel. Add SUPABASE_SERVICE_ROLE_KEY to Production and redeploy.";
}

function adminActionMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "";

  const trimmed = message.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase();
  if (
    trimmed.startsWith("{") ||
    lower.includes("\"url\"") ||
    lower.includes("/auth/v1/admin/users") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch")
  ) {
    return fallback;
  }

  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("unauthorized")) {
    return "Supabase rejected the Admin API request. Use the real SUPABASE_SERVICE_ROLE_KEY for this production Supabase project, not the anon key.";
  }

  return trimmed;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/users");
  const profile = await getAuthProfile(supabase, user.id);
  if (!isAdmin(profile)) redirect("/admin/settings?error=Only%20admin%20can%20manage%20staff%20users.");
  return { supabase, user, profile: profile! };
}

function refreshUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/settings");
}

export async function createStaffAccount(formData: FormData) {
  const { supabase, user, profile } = await requireAdmin();

  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const phone = optionalText(formData, "phone");
  const role = text(formData, "role");
  const branchId = text(formData, "branch_id");
  const password = text(formData, "temporary_password");

  if (!fullName || !email || !branchId || !password) {
    redirect("/admin/users?error=Full%20name,%20email,%20branch,%20and%20temporary%20password%20are%20required.");
  }
  if (role !== "manager" && role !== "cashier") {
    redirect("/admin/users?error=Only%20manager%20and%20cashier%20staff%20accounts%20can%20be%20created%20here.");
  }
  if (password.length < 8) {
    redirect("/admin/users?error=Temporary%20password%20must%20be%20at%20least%208%20characters.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/users?error=${encode(adminSetupMessage())}`);
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
      role,
    },
  });

  if (authError || !authData.user) {
    redirect(
      `/admin/users?error=${encode(
        adminActionMessage(authError, "Could not create staff Auth user. Confirm SUPABASE_SERVICE_ROLE_KEY is set in Vercel Production and belongs to this Supabase project."),
      )}`,
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: authData.user.id,
      full_name: fullName,
      phone,
      role,
      branch_id: branchId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    redirect(`/admin/users?error=${encode(profileError.message || "Auth user was created but profile could not be saved.")}`);
  }

  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: "staff_account_created",
    entityType: "profile",
    entityId: authData.user.id,
    metadata: { role, email },
  });
  refreshUsers();
  redirect(`/admin/users?success=${encode(`${role === "manager" ? "Manager" : "Cashier"} account created. Staff can log in immediately.`)}`);
}

export async function updateStaffAccount(formData: FormData) {
  const { supabase, user, profile } = await requireAdmin();

  const profileId = text(formData, "profile_id");
  const role = text(formData, "role");
  const branchId = optionalText(formData, "branch_id");

  if (!profileId) redirect("/admin/users?error=User%20profile%20is%20required.");
  if (role !== "admin" && role !== "manager" && role !== "cashier" && role !== "vendor" && role !== "customer") {
    redirect("/admin/users?error=Invalid%20role.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/users?error=${encode(adminSetupMessage())}`);
  }

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      phone: optionalText(formData, "phone"),
      role,
      branch_id: branchId,
      is_active: checkbox(formData, "is_active"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) redirect(`/admin/users?error=${encode(error.message || "Could not update staff profile.")}`);

  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: "staff_account_updated",
    entityType: "profile",
    entityId: profileId,
    metadata: { role, branchId },
  });
  refreshUsers();
  redirect("/admin/users?success=User%20updated.");
}

export async function resetStaffPassword(formData: FormData) {
  const { supabase, user, profile } = await requireAdmin();

  const profileId = text(formData, "profile_id");
  const password = text(formData, "temporary_password");
  if (!profileId || password.length < 8) {
    redirect("/admin/users?error=Choose%20a%20temporary%20password%20with%20at%20least%208%20characters.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(`/admin/users?error=${encode(adminSetupMessage())}`);
  }

  const { error } = await admin.auth.admin.updateUserById(profileId, {
    password,
  });

  if (error) {
    redirect(
      `/admin/users?error=${encode(
        adminActionMessage(error, "Could not reset password. Confirm SUPABASE_SERVICE_ROLE_KEY is set in Vercel Production and belongs to this Supabase project."),
      )}`,
    );
  }

  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: "staff_password_reset",
    entityType: "profile",
    entityId: profileId,
  });
  refreshUsers();
  redirect("/admin/users?success=Temporary%20password%20updated.");
}
