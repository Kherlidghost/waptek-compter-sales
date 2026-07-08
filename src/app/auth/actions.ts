"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function encodedMessage(type: "error" | "success", message: string) {
  return `/login?${type}=${encodeURIComponent(message)}`;
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before signing in."));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(encodedMessage("error", error.message));
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before creating accounts."));
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
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
    redirect(encodedMessage("error", error.message));
  }

  redirect(encodedMessage("success", "Account created. Sign in to continue. Vendor approval happens from the admin dashboard."));
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
