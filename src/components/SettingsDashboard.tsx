import Link from "next/link";
import type { ReactNode } from "react";
import {
  saveBranchSettings,
  updateCompanySettings,
  updateMarketplaceSettings,
  updateOwnProfileSettings,
  updateUserAdministration,
  updateVendorSettings,
} from "@/app/settings/actions";
import { getAuthProfile, isAdmin, isCashier, isManager, isVendor, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, UserRole, VendorStatus } from "@/lib/types";

type SettingsRole = Extract<UserRole, "admin" | "manager" | "cashier" | "vendor">;

type SearchParams = {
  error?: string;
  success?: string;
};

type CompanySettings = {
  company_name: string;
  logo_path: string | null;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_number: string | null;
  business_address: string | null;
  about_text: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  payment_instructions: string | null;
};

type MarketplaceSettings = {
  allow_vendor_registration: boolean;
  require_vendor_approval: boolean;
  require_email_confirmation: boolean;
  allow_guest_cart: boolean;
  default_product_status: string;
};

type BranchRow = {
  id: string;
  name: string;
  state: BranchState;
  city: string;
  address: string | null;
  phone: string | null;
  support_contact: string | null;
  manager_profile_id: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  branch_id: string | null;
  is_active?: boolean | null;
};

type VendorRow = {
  id: string;
  business_name: string;
  owner_name: string | null;
  business_phone: string | null;
  business_address: string | null;
  business_description?: string | null;
  business_logo_path: string | null;
  status: VendorStatus;
};

const states: BranchState[] = ["Adamawa", "Yobe", "Borno"];
const roles: UserRole[] = ["admin", "manager", "cashier", "vendor", "customer"];

function decodeMessage(value?: string) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function logoUrl(bucket: string, path?: string | null) {
  if (!path || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue?: string | null; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function TextArea({ label, name, defaultValue, rows = 4 }: { label: string; name: string; defaultValue?: string | null; rows?: number }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">
      {label}
      <textarea
        className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600"
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}

function SaveButton({ children = "Save changes" }: { children?: string }) {
  return <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800">{children}</button>;
}

function DashboardNav({ role }: { role: SettingsRole }) {
  const base = roleHome[role];
  const links = [
    ["Dashboard", base],
    ...(role === "admin" || role === "manager" || role === "vendor" ? [["Products", `${base}/products`], ["Inventory", `${base}/inventory`]] : []),
    ...(role === "admin" ? [["Vendors", "/admin/vendors"]] : []),
    ["Orders", `${base}/orders`],
    ["Reports", `${base}/reports`],
    ["Settings", `${base}/settings`],
  ];
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm">
      {links.map(([label, href]) => (
        <Link key={label} href={href} className="whitespace-nowrap rounded-md px-3 py-2 font-bold text-slate-700 hover:bg-slate-100">
          {label}
        </Link>
      ))}
    </nav>
  );
}

export async function SettingsDashboard({ role, searchParams }: { role: SettingsRole; searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;
  const returnTo = `/${role}/settings`;
  const success = decodeMessage(searchParams.success);
  const error = decodeMessage(searchParams.error);

  const canUsePage =
    (role === "admin" && profile && isAdmin(profile)) ||
    (role === "manager" && profile && isManager(profile)) ||
    (role === "cashier" && profile && isCashier(profile)) ||
    (role === "vendor" && profile && isVendor(profile));

  if (!canUsePage) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
        Your account profile is incomplete or does not have access to this settings area.
      </div>
    );
  }

  const [
    companyResult,
    marketplaceResult,
    branchesResult,
    profilesResult,
    vendorResult,
    branchResult,
    ownProfileResult,
  ] = await Promise.all([
    role === "admin" ? supabase.from("company_settings").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: null, error: null }),
    role === "admin" ? supabase.from("marketplace_settings").select("*").eq("id", 1).maybeSingle() : Promise.resolve({ data: null, error: null }),
    role === "admin" ? supabase.from("branches").select("id, name, state, city, address, phone, support_contact, manager_profile_id").order("state") : Promise.resolve({ data: [], error: null }),
    role === "admin" ? supabase.from("profiles").select("id, full_name, phone, role, branch_id, is_active").order("role") : Promise.resolve({ data: [], error: null }),
    role === "vendor" && user
      ? supabase.from("vendors").select("id, business_name, owner_name, business_phone, business_address, business_description, business_logo_path, status").eq("profile_id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    (role === "manager" || role === "cashier") && profile?.branch_id
      ? supabase.from("branches").select("id, name, state, city, address, phone, support_contact, manager_profile_id").eq("id", profile.branch_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    user ? supabase.from("profiles").select("id, full_name, phone, role, branch_id, is_active").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);

  const hasSettingsSchemaError = Boolean(companyResult.error || marketplaceResult.error || branchesResult.error || profilesResult.error || vendorResult.error || branchResult.error);
  const company = companyResult.data as CompanySettings | null;
  const marketplace = marketplaceResult.data as MarketplaceSettings | null;
  const branches = (branchesResult.data ?? []) as BranchRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const vendor = vendorResult.data as VendorRow | null;
  const assignedBranch = branchResult.data as BranchRow | null;
  const ownProfile = ownProfileResult.data as ProfileRow | null;
  const companyLogo = logoUrl("settings-assets", company?.logo_path);
  const vendorLogo = logoUrl("vendor-assets", vendor?.business_logo_path);

  return (
    <div className="grid gap-6">
      <DashboardNav role={role} />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Administration settings</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {role === "admin" ? "Company Settings" : role === "manager" ? "Branch Settings" : role === "vendor" ? "Vendor Settings" : "Cashier Settings"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          {role === "admin"
            ? "Configure company details, checkout bank account information, branches, users, marketplace rules, and operational security notes."
            : role === "manager"
              ? "Manage only the branch assigned to your manager profile. Global company and payment settings remain admin-controlled."
              : role === "vendor"
                ? "Maintain your business profile for marketplace customers. Approval status is controlled by admin."
                : "Review your staff profile and assigned branch. Payment confirmation work stays in the cashier dashboard."}
        </p>
      </section>

      {success ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{success}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      {hasSettingsSchemaError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Some settings data could not load. Run <span className="font-black">supabase/settings-management-upgrade.sql</span> in Supabase Production SQL Editor.
        </div>
      ) : null}

      {role === "admin" ? (
        <>
          <Card title="Company Profile" description="Public company identity and support contact details.">
            <form action={updateCompanySettings} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="existing_logo_path" value={company?.logo_path ?? ""} />
              <Field label="Company name" name="company_name" defaultValue={company?.company_name ?? "CompuMarket NG"} required />
              <Field label="Support email" name="support_email" type="email" defaultValue={company?.support_email} />
              <Field label="Support phone" name="support_phone" defaultValue={company?.support_phone} />
              <Field label="WhatsApp placeholder" name="whatsapp_number" defaultValue={company?.whatsapp_number} />
              <TextArea label="Business address" name="business_address" defaultValue={company?.business_address} />
              <TextArea label="About text" name="about_text" defaultValue={company?.about_text} />
              <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">
                Logo
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-20 w-20 rounded-md border object-cover" src={companyLogo} alt="Company logo" />
                ) : null}
                <input className="rounded-md border border-slate-300 px-3 py-2" name="logo" type="file" accept="image/*" />
              </label>
              <div className="md:col-span-2"><SaveButton /></div>
            </form>
          </Card>

          <Card title="Bank Account Settings" description="These details appear on checkout for manual transfer payment.">
            <form action={updateCompanySettings} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="existing_logo_path" value={company?.logo_path ?? ""} />
              <input type="hidden" name="company_name" value={company?.company_name ?? "CompuMarket NG"} />
              <input type="hidden" name="support_email" value={company?.support_email ?? ""} />
              <input type="hidden" name="support_phone" value={company?.support_phone ?? ""} />
              <input type="hidden" name="whatsapp_number" value={company?.whatsapp_number ?? ""} />
              <input type="hidden" name="business_address" value={company?.business_address ?? ""} />
              <input type="hidden" name="about_text" value={company?.about_text ?? ""} />
              <Field label="Bank name" name="bank_name" defaultValue={company?.bank_name} />
              <Field label="Account name" name="account_name" defaultValue={company?.account_name} />
              <Field label="Account number" name="account_number" defaultValue={company?.account_number} />
              <TextArea label="Payment instructions" name="payment_instructions" defaultValue={company?.payment_instructions} />
              <div className="md:col-span-2"><SaveButton>Save bank settings</SaveButton></div>
            </form>
          </Card>

          <Card title="Branch Management" description="Add or edit branches and assign a manager profile.">
            <div className="grid gap-4">
              {[...branches, null].map((branch) => (
                <form key={branch?.id ?? "new"} action={saveBranchSettings} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-3">
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="branch_id" value={branch?.id ?? ""} />
                  <Field label="Branch name" name="name" defaultValue={branch?.name} required />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    State
                    <select name="state" defaultValue={branch?.state ?? "Adamawa"} className="rounded-md border border-slate-300 px-3 py-2">
                      {states.map((state) => <option key={state}>{state}</option>)}
                    </select>
                  </label>
                  <Field label="City" name="city" defaultValue={branch?.city} required />
                  <Field label="Branch phone" name="phone" defaultValue={branch?.phone} />
                  <Field label="Support contact" name="support_contact" defaultValue={branch?.support_contact} />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Manager
                    <select name="manager_profile_id" defaultValue={branch?.manager_profile_id ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                      <option value="">Unassigned</option>
                      {profiles.filter((item) => item.role === "manager").map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
                    </select>
                  </label>
                  <TextArea label="Address" name="address" defaultValue={branch?.address} rows={2} />
                  <div className="md:col-span-3"><SaveButton>{branch ? "Save branch" : "Add branch"}</SaveButton></div>
                </form>
              ))}
            </div>
          </Card>

          <Card title="User Management" description="Assign roles, branches, and account active status for operational users.">
            {profiles.length === 0 ? <p className="rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-600">No users found.</p> : null}
            <div className="grid gap-3">
              {profiles.map((item) => (
                <form key={item.id} action={updateUserAdministration} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-5">
                  <input type="hidden" name="return_to" value={returnTo} />
                  <input type="hidden" name="profile_id" value={item.id} />
                  <Field label="Full name" name="full_name" defaultValue={item.full_name} required />
                  <Field label="Phone" name="phone" defaultValue={item.phone} />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Role
                    <select name="role" defaultValue={item.role} className="rounded-md border border-slate-300 px-3 py-2">
                      {roles.map((userRole) => <option key={userRole}>{userRole}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Branch
                    <select name="branch_id" defaultValue={item.branch_id ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                      <option value="">No branch</option>
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </label>
                  <label className="flex items-end gap-2 text-sm font-bold text-slate-700">
                    <input name="is_active" type="checkbox" defaultChecked={item.is_active !== false} />
                    Active
                  </label>
                  <div className="md:col-span-5"><SaveButton>Update user</SaveButton></div>
                </form>
              ))}
            </div>
          </Card>

          <Card title="Marketplace Settings" description="Control registration, approval, email confirmation reminders, guest cart, and default product state.">
            <form action={updateMarketplaceSettings} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="return_to" value={returnTo} />
              {[
                ["allow_vendor_registration", "Allow vendor registration", marketplace?.allow_vendor_registration ?? true],
                ["require_vendor_approval", "Require vendor approval", marketplace?.require_vendor_approval ?? true],
                ["require_email_confirmation", "Require email confirmation", marketplace?.require_email_confirmation ?? true],
                ["allow_guest_cart", "Allow guest cart", marketplace?.allow_guest_cart ?? true],
              ].map(([name, label, checked]) => (
                <label key={String(name)} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700">
                  <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} />
                  {label}
                </label>
              ))}
              <label className="grid gap-1 text-sm font-bold text-slate-700">
                Default product status
                <select name="default_product_status" defaultValue={marketplace?.default_product_status ?? "draft"} className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="draft">Draft</option>
                  <option value="active">Published</option>
                  <option value="inactive">Hidden</option>
                </select>
              </label>
              <div className="md:col-span-2"><SaveButton>Save marketplace settings</SaveButton></div>
            </form>
          </Card>

          <Card title="Security Settings" description="Operational security guidance for the owner and staff.">
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4"><strong>Email confirmation:</strong> keep Supabase email confirmation enabled for customers and staff.</div>
              <div className="rounded-md bg-slate-50 p-4"><strong>Password resets:</strong> use Supabase Auth password reset links from the dashboard or login flow.</div>
              <div className="rounded-md bg-slate-50 p-4"><strong>Staff accounts:</strong> create staff in Supabase Auth first, then match the profile role and branch here.</div>
            </div>
          </Card>
        </>
      ) : null}

      {role === "manager" && assignedBranch ? (
        <Card title="Assigned Branch" description="Update customer-facing support details for your branch only.">
          <form action={saveBranchSettings} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="return_to" value={returnTo} />
            <input type="hidden" name="branch_id" value={assignedBranch.id} />
            <input type="hidden" name="manager_profile_id" value={assignedBranch.manager_profile_id ?? ""} />
            <Field label="Branch name" name="name" defaultValue={assignedBranch.name} required />
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              State
              <select name="state" defaultValue={assignedBranch.state} className="rounded-md border border-slate-300 px-3 py-2">
                {states.map((state) => <option key={state}>{state}</option>)}
              </select>
            </label>
            <Field label="City" name="city" defaultValue={assignedBranch.city} required />
            <Field label="Branch phone" name="phone" defaultValue={assignedBranch.phone} />
            <Field label="Support contact" name="support_contact" defaultValue={assignedBranch.support_contact} />
            <TextArea label="Address" name="address" defaultValue={assignedBranch.address} />
            <div className="md:col-span-2"><SaveButton>Save branch settings</SaveButton></div>
          </form>
        </Card>
      ) : null}

      {(role === "manager" || role === "cashier") && ownProfile ? (
        <Card title="My Staff Profile" description={role === "cashier" ? "Cashiers can view branch assignment and update personal contact information." : "Managers can update personal contact information."}>
          <form action={updateOwnProfileSettings} className="grid gap-4 md:grid-cols-3">
            <input type="hidden" name="return_to" value={returnTo} />
            <Field label="Full name" name="full_name" defaultValue={ownProfile.full_name} required />
            <Field label="Phone" name="phone" defaultValue={ownProfile.phone} />
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <span className="font-bold text-slate-500">Assigned branch</span>
              <p className="font-black text-slate-900">{assignedBranch ? `${assignedBranch.name}, ${assignedBranch.state}` : "No branch assigned"}</p>
            </div>
            {role === "manager" ? <div className="md:col-span-3"><SaveButton>Save profile</SaveButton></div> : <div className="md:col-span-3"><SaveButton>Save profile</SaveButton></div>}
          </form>
        </Card>
      ) : null}

      {role === "vendor" ? (
        <Card title="Vendor Business Profile" description="Update marketplace-facing business details. Approval status is shown for transparency only.">
          {vendor ? (
            <form action={updateVendorSettings} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="return_to" value={returnTo} />
              <input type="hidden" name="existing_business_logo_path" value={vendor.business_logo_path ?? ""} />
              <div className="md:col-span-2 rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-700">
                Approval status: <span className="capitalize text-slate-950">{vendor.status}</span>
              </div>
              <Field label="Business name" name="business_name" defaultValue={vendor.business_name} required />
              <Field label="Owner name" name="owner_name" defaultValue={vendor.owner_name} />
              <Field label="Phone" name="business_phone" defaultValue={vendor.business_phone} />
              <Field label="Address" name="business_address" defaultValue={vendor.business_address} />
              <TextArea label="Business description" name="business_description" defaultValue={vendor.business_description} />
              <label className="grid gap-1 text-sm font-bold text-slate-700 md:col-span-2">
                Business logo
                {vendorLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-20 w-20 rounded-md border object-cover" src={vendorLogo} alt="Vendor logo" />
                ) : null}
                <input className="rounded-md border border-slate-300 px-3 py-2" name="business_logo" type="file" accept="image/*" />
              </label>
              <div className="md:col-span-2"><SaveButton>Save vendor profile</SaveButton></div>
            </form>
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-600">No vendor profile found for this account.</p>
          )}
        </Card>
      ) : null}

      {role === "cashier" && assignedBranch ? (
        <Card title="Assigned Branch" description="Cashiers can view branch context but cannot edit branch or global settings.">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><span className="font-bold text-slate-500">Branch</span><p className="font-black text-slate-950">{assignedBranch.name}</p></div>
            <div><span className="font-bold text-slate-500">Location</span><p className="font-black text-slate-950">{assignedBranch.city}, {assignedBranch.state}</p></div>
            <div><span className="font-bold text-slate-500">Phone</span><p className="font-black text-slate-950">{assignedBranch.phone ?? "Not set"}</p></div>
            <div><span className="font-bold text-slate-500">Support contact</span><p className="font-black text-slate-950">{assignedBranch.support_contact ?? "Not set"}</p></div>
            <div className="md:col-span-2"><span className="font-bold text-slate-500">Address</span><p className="font-black text-slate-950">{assignedBranch.address ?? "Not set"}</p></div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
