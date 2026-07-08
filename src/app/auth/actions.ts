"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUserRole, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function encodedMessage(type: "error" | "success", message: string, next?: string) {
  const params = new URLSearchParams({ [type]: message });
  if (next?.startsWith("/")) params.set("next", next);
  return `/login?${params.toString()}`;
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before signing in."));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(encodedMessage("error", error.message, next));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const fallback = isUserRole(profile?.role) ? roleHome[profile.role] : roleHome.customer;

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : fallback);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before creating accounts."));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const next = String(formData.get("next") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    redirect(encodedMessage("error", error.message, next));
  }

  redirect(encodedMessage("success", "Account created. Sign in to continue. Vendor approval happens from the admin dashboard.", next));
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
