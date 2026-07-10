"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin, isCashier, isManager, isSafeRedirect, isVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const settingsBucket = "settings-assets";
const vendorBucket = "vendor-assets";

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

function returnPath(formData: FormData) {
  const value = text(formData, "return_to") || "/admin/settings";
  return isSafeRedirect(value) ? value : "/admin/settings";
}

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

async function requireProfile(next = "/admin/settings") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");
  return { supabase, user, profile };
}

function revalidateSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/manager/settings");
  revalidatePath("/vendor/settings");
  revalidatePath("/cashier/settings");
  revalidatePath("/checkout");
}

export async function updateCompanySettings(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, user, profile } = await requireProfile(back);
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20update%20company%20settings.`);

  let logoPath = optionalText(formData, "existing_logo_path");
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) redirect(`${back}?error=Upload%20an%20image%20logo.`);
    const storagePath = `company/${Date.now()}-${cleanFileName(logo.name || "logo")}`;
    const { error } = await supabase.storage.from(settingsBucket).upload(storagePath, logo, {
      contentType: logo.type,
      upsert: false,
    });
    if (error) redirect(`${back}?error=Could%20not%20upload%20company%20logo.`);
    logoPath = storagePath;
  }

  const { error } = await supabase.from("company_settings").upsert(
    {
      id: 1,
      company_name: text(formData, "company_name") || "WAPTEK COMPUTER SERVICES",
      logo_path: logoPath,
      support_email: optionalText(formData, "support_email"),
      support_phone: optionalText(formData, "support_phone"),
      whatsapp_number: optionalText(formData, "whatsapp_number"),
      business_address: optionalText(formData, "business_address"),
      about_text: optionalText(formData, "about_text"),
      bank_name: optionalText(formData, "bank_name"),
      account_name: optionalText(formData, "account_name"),
      account_number: optionalText(formData, "account_number"),
      payment_instructions: optionalText(formData, "payment_instructions"),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) redirect(`${back}?error=Could%20not%20save%20company%20settings.%20Run%20the%20settings%20SQL%20first.`);
  revalidateSettings();
  redirect(`${back}?success=Company%20settings%20saved.`);
}

export async function updateMarketplaceSettings(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, user, profile } = await requireProfile(back);
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20update%20marketplace%20settings.`);

  const defaultProductStatus = text(formData, "default_product_status") || "draft";
  const { error } = await supabase.from("marketplace_settings").upsert(
    {
      id: 1,
      allow_vendor_registration: checkbox(formData, "allow_vendor_registration"),
      require_vendor_approval: checkbox(formData, "require_vendor_approval"),
      require_email_confirmation: checkbox(formData, "require_email_confirmation"),
      allow_guest_cart: checkbox(formData, "allow_guest_cart"),
      default_product_status: defaultProductStatus,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) redirect(`${back}?error=Could%20not%20save%20marketplace%20settings.%20Run%20the%20settings%20SQL%20first.`);
  revalidateSettings();
  redirect(`${back}?success=Marketplace%20settings%20saved.`);
}

export async function saveBranchSettings(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, profile } = await requireProfile(back);
  const branchId = text(formData, "branch_id");
  const isNewBranch = !branchId;
  if (isNewBranch && !isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20add%20branches.`);
  if (!isAdmin(profile) && (!isManager(profile) || profile.branch_id !== branchId)) {
    redirect(`${back}?error=You%20can%20only%20edit%20your%20assigned%20branch.`);
  }

  const payload = {
    name: text(formData, "name"),
    state: text(formData, "state"),
    city: text(formData, "city"),
    address: optionalText(formData, "address"),
    phone: optionalText(formData, "phone"),
    support_contact: optionalText(formData, "support_contact"),
    manager_profile_id: optionalText(formData, "manager_profile_id"),
    updated_at: new Date().toISOString(),
  };
  if (!payload.name || !payload.state || !payload.city) redirect(`${back}?error=Branch%20name,%20state,%20and%20city%20are%20required.`);

  const result = branchId
    ? await supabase.from("branches").update(payload).eq("id", branchId)
    : await supabase.from("branches").insert(payload);

  if (result.error) redirect(`${back}?error=Could%20not%20save%20branch.%20Run%20the%20settings%20SQL%20first.`);
  revalidateSettings();
  redirect(`${back}?success=Branch%20settings%20saved.`);
}

export async function updateUserAdministration(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, profile } = await requireProfile(back);
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20manage%20users.`);

  const userId = text(formData, "profile_id");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      phone: optionalText(formData, "phone"),
      role: text(formData, "role"),
      branch_id: optionalText(formData, "branch_id"),
      is_active: checkbox(formData, "is_active"),
    })
    .eq("id", userId);

  if (error) redirect(`${back}?error=Could%20not%20update%20user.%20Run%20the%20settings%20SQL%20first.`);
  revalidateSettings();
  redirect(`${back}?success=User%20updated.`);
}

export async function updateVendorSettings(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, user, profile } = await requireProfile(back);
  if (!isVendor(profile)) redirect(`${back}?error=Only%20vendors%20can%20edit%20vendor%20settings.`);

  let logoPath = optionalText(formData, "existing_business_logo_path");
  const logo = formData.get("business_logo");
  if (logo instanceof File && logo.size > 0) {
    if (!logo.type.startsWith("image/")) redirect(`${back}?error=Upload%20an%20image%20logo.`);
    const storagePath = `${user.id}/${Date.now()}-${cleanFileName(logo.name || "logo")}`;
    const { error } = await supabase.storage.from(vendorBucket).upload(storagePath, logo, {
      contentType: logo.type,
      upsert: false,
    });
    if (error) redirect(`${back}?error=Could%20not%20upload%20vendor%20logo.`);
    logoPath = storagePath;
  }

  const { error } = await supabase
    .from("vendors")
    .update({
      business_name: text(formData, "business_name"),
      owner_name: optionalText(formData, "owner_name"),
      business_phone: optionalText(formData, "business_phone"),
      business_address: optionalText(formData, "business_address"),
      business_description: optionalText(formData, "business_description"),
      business_logo_path: logoPath,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", user.id);

  if (error) redirect(`${back}?error=Could%20not%20save%20vendor%20profile.%20Run%20the%20settings%20SQL%20first.`);
  revalidateSettings();
  redirect(`${back}?success=Vendor%20profile%20saved.`);
}

export async function updateOwnProfileSettings(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, user, profile } = await requireProfile(back);
  if (!isCashier(profile) && !isManager(profile)) redirect(`${back}?error=This%20profile%20setting%20is%20not%20available.`);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      phone: optionalText(formData, "phone"),
    })
    .eq("id", user.id);

  if (error) redirect(`${back}?error=Could%20not%20save%20profile.`);
  revalidateSettings();
  redirect(`${back}?success=Profile%20saved.`);
}
