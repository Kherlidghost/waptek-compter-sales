"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { emailNotConfirmedMessage, getAuthProfile, incompleteProfileMessage, isCashier, isCustomer, isEmailConfirmed, isManager, isSafeRedirect, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function encodedMessage(type: "error" | "success", message: string, next?: string) {
  const params = new URLSearchParams({ [type]: message });
  if (next?.startsWith("/")) params.set("next", next);
  return `/login?${params.toString()}`;
}

function authErrorMessage(error: { message?: unknown }) {
  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return "Invalid email or password.";
  if (message.includes("email not confirmed") || message.includes("not confirmed")) return emailNotConfirmedMessage;
  if (message.includes("already registered")) return "An account already exists for this email address.";
  if (message.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "Login failed. Please check your email and password.";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  return host ? `${protocol}://${host}` : "";
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before signing in."));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!isValidEmail(email) || !password) {
    redirect(encodedMessage("error", "Invalid email or password.", next));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(encodedMessage("error", authErrorMessage(error), next));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isEmailConfirmed(user)) {
    await supabase.auth.signOut();
    redirect(encodedMessage("error", emailNotConfirmedMessage, next));
  }

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

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (!fullName) redirect(encodedMessage("error", "Full name is required.", next));
  if (!phone) redirect(encodedMessage("error", "Phone number is required.", next));
  if (!isValidEmail(email)) redirect(encodedMessage("error", "Enter a valid email address.", next));
  if (password.length < 8) redirect(encodedMessage("error", "Password must be at least 8 characters.", next));
  if (password !== confirmPassword) redirect(encodedMessage("error", "Password and confirm password must match.", next));

  const supabase = await createClient();
  const origin = await getOrigin();
  const redirectTo = `${origin}/auth/callback${isSafeRedirect(next) ? `?next=${encodeURIComponent(next)}` : ""}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    redirect(encodedMessage("error", authErrorMessage(error), next));
  }

  await supabase.auth.signOut();
  redirect(encodedMessage("success", "Account created. Please check your email and confirm your account before signing in.", next));
}

export async function resendConfirmationAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect(encodedMessage("error", "Add Supabase environment variables before resending confirmation email."));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "");

  if (!isValidEmail(email)) {
    redirect(encodedMessage("error", "Enter the email address you used to register.", next));
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  const redirectTo = `${origin}/auth/callback${isSafeRedirect(next) ? `?next=${encodeURIComponent(next)}` : ""}`;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    redirect(encodedMessage("error", authErrorMessage(error), next));
  }

  redirect(encodedMessage("success", "Confirmation email sent. Please check your inbox.", next));
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/?signed_out=1");
}
