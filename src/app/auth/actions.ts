"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, incompleteProfileMessage, isCashier, isCustomer, isManager, isSafeRedirect, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function encodedMessage(type: "error" | "success", message: string, next?: string) {
  const params = new URLSearchParams({ [type]: message });
  if (next?.startsWith("/")) params.set("next", next);
  return `/login?${params.toString()}`;
}

function authErrorMessage(error: { message?: unknown }) {
  return typeof error.message === "string" && error.message.trim()
    ? error.message
    : "Login failed. Please check your email and password.";
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
    redirect(encodedMessage("error", authErrorMessage(error), next));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!profile) {
    await supabase.auth.signOut();
    redirect(encodedMessage("error", incompleteProfileMessage, next));
  }

  if ((isManager(profile) || isCashier(profile)) && !profile.branch_id) {
    await supabase.auth.signOut();
    redirect(encodedMessage("error", incompleteProfileMessage, next));
  }

  const destination = isCustomer(profile) && isSafeRedirect(next) ? next : roleHome[profile.role];

  revalidatePath("/", "layout");
  redirect(destination);
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
    redirect(encodedMessage("error", authErrorMessage(error), next));
  }

  redirect(encodedMessage("success", "Account created. Sign in to continue. Vendor approval happens from the admin dashboard.", next));
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/?signed_out=1");
}
