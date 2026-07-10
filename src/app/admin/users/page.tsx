import { createStaffAccount, resetStaffPassword, updateStaffAccount } from "@/app/admin/users/actions";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { StatusBadge } from "@/components/StatusBadge";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BranchState, UserRole } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  success?: string;
};

type BranchRow = {
  id: string;
  name: string;
  state: BranchState;
  city: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  branch_id: string | null;
  is_active: boolean | null;
  created_at: string;
};

const roles: UserRole[] = ["admin", "manager", "cashier", "vendor", "customer"];

function decodeMessage(value?: string) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanAdminAuthMessage(error: unknown) {
  const setupMessage =
    "Add the server-only SUPABASE_SERVICE_ROLE_KEY to Vercel Production environment variables and redeploy. Use the service_role key from the same Supabase project.";

  if (!error) return setupMessage;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "";

  const trimmed = message.trim();
  if (!trimmed) return setupMessage;

  const lower = trimmed.toLowerCase();
  if (
    trimmed.startsWith("{") ||
    lower.includes("\"url\"") ||
    lower.includes("/auth/v1/admin/users") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch")
  ) {
    return setupMessage;
  }

  if (lower.includes("invalid api key") || lower.includes("jwt") || lower.includes("unauthorized")) {
    return "Supabase rejected the Admin API request. Set the real service_role key for this production Supabase project, not the anon key, then redeploy.";
  }

  return trimmed;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const success = decodeMessage(params.success);
  const error = decodeMessage(params.error);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!isAdmin(profile)) {
    return (
      <main className="min-h-screen dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <DashboardSessionBar role="admin" />
        <section className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm font-semibold text-amber-900 shadow-sm">
          Only admin users can manage staff accounts.
        </section>
      </main>
    );
  }

  const [{ data: branchData }, { data: profileData }] = await Promise.all([
    supabase.from("branches").select("id, name, state, city").order("state"),
    supabase.from("profiles").select("id, full_name, phone, role, branch_id, is_active, created_at").order("created_at", { ascending: false }),
  ]);

  const branches = (branchData ?? []) as BranchRow[];
  const profiles = (profileData ?? []) as ProfileRow[];
  const branchById = new Map(branches.map((branch) => [branch.id, branch]));
  const emailById = new Map<string, string>();
  let authAdminReady = true;
  let authAdminMessage = "";

  try {
    const admin = createAdminClient();
    const { data, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) {
      authAdminReady = false;
      authAdminMessage = cleanAdminAuthMessage(authError);
    } else {
      data.users.forEach((authUser) => {
        if (authUser.email) emailById.set(authUser.id, authUser.email);
      });
    }
  } catch (authError) {
    authAdminReady = false;
    authAdminMessage = cleanAdminAuthMessage(authError);
  }

  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="admin" />

      <section className="premium-panel mx-auto max-w-7xl rounded-2xl p-6">
        <p className="text-sm font-black uppercase text-emerald-700">Admin Staff Management</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Manage Users</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Create manager and cashier accounts, assign staff to branches, update active status, and reset temporary passwords.
            </p>
          </div>
          <a className="rounded-lg border border-slate-300 bg-white/80 px-4 py-3 text-sm font-black text-slate-900 hover:border-emerald-500" href="/admin/settings">
            Back to Settings
          </a>
        </div>
      </section>

      {success ? <div className="mx-auto max-w-7xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{success}</div> : null}
      {error ? <div className="mx-auto max-w-7xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div> : null}
      {!authAdminReady ? (
        <div className="mx-auto max-w-7xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          <p className="font-black">Staff Auth email lookup, account creation, and password reset need Supabase Admin access.</p>
          <p className="mt-1">
            Add <span className="font-black">SUPABASE_SERVICE_ROLE_KEY</span> as a server-only Vercel Production environment variable, then redeploy.
          </p>
          <p className="mt-1 text-amber-800">Details: {authAdminMessage}</p>
        </div>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <form action={createStaffAccount} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
          <p className="text-sm font-black uppercase text-emerald-700">Add Staff</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Create Manager or Cashier</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Staff can log in immediately with the temporary password.</p>
          <div className="mt-5 grid gap-4">
            <Field label="Full name" name="full_name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Phone" name="phone" />
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              Role
              <select className="rounded-lg border border-slate-300 px-3 py-2 font-medium" name="role" required defaultValue="manager">
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-slate-700">
              Branch
              <select className="rounded-lg border border-slate-300 px-3 py-2 font-medium" name="branch_id" required defaultValue="">
                <option value="" disabled>Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name} ({branch.state})</option>
                ))}
              </select>
            </label>
            <Field label="Temporary password" name="temporary_password" type="password" required />
            <button
              className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={!authAdminReady}
            >
              {authAdminReady ? "Create Staff Account" : "Add service role key to create staff"}
            </button>
          </div>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-2xl font-black text-slate-950">All Users</h2>
            <p className="mt-1 text-sm text-slate-600">Emails are read securely from Supabase Auth on the server.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <p className="font-bold text-slate-950">No users found.</p>
                      <p className="mt-1 text-sm text-slate-600">Create a manager or cashier to start staff management.</p>
                    </td>
                  </tr>
                ) : profiles.map((item) => {
                  const branch = item.branch_id ? branchById.get(item.branch_id) : null;
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3 font-black text-slate-950">{item.full_name}</td>
                      <td className="px-4 py-3">{emailById.get(item.id) ?? (authAdminReady ? "No auth email found" : "Auth email unavailable")}</td>
                      <td className="px-4 py-3">{item.phone ?? "Not set"}</td>
                      <td className="px-4 py-3 capitalize">{item.role}</td>
                      <td className="px-4 py-3">{branch ? `${branch.name} (${branch.state})` : "No branch"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.is_active === false ? "inactive" : "active"} label={item.is_active === false ? "Inactive" : "Active"} />
                      </td>
                      <td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString("en-NG")}</td>
                      <td className="px-4 py-3">
                        <details className="min-w-80 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <summary className="cursor-pointer text-xs font-black text-slate-900">Manage</summary>
                          <form action={updateStaffAccount} className="mt-3 grid gap-3">
                            <input type="hidden" name="profile_id" value={item.id} />
                            <Field label="Full name" name="full_name" defaultValue={item.full_name} required />
                            <Field label="Phone" name="phone" defaultValue={item.phone} />
                            <label className="grid gap-1 text-sm font-bold text-slate-700">
                              Role
                              <select className="rounded-lg border border-slate-300 px-3 py-2" name="role" defaultValue={item.role}>
                                {roles.map((userRole) => <option key={userRole} value={userRole}>{userRole}</option>)}
                              </select>
                            </label>
                            <label className="grid gap-1 text-sm font-bold text-slate-700">
                              Branch
                              <select className="rounded-lg border border-slate-300 px-3 py-2" name="branch_id" defaultValue={item.branch_id ?? ""}>
                                <option value="">No branch</option>
                                {branches.map((branchOption) => (
                                  <option key={branchOption.id} value={branchOption.id}>{branchOption.name} ({branchOption.state})</option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                              <input name="is_active" type="checkbox" defaultChecked={item.is_active !== false} />
                              Active account
                            </label>
                            <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-black text-white">Save user</button>
                          </form>
                          <form action={resetStaffPassword} className="mt-3 grid gap-2 border-t border-slate-200 pt-3">
                            <input type="hidden" name="profile_id" value={item.id} />
                            <Field label="New temporary password" name="temporary_password" type="password" required />
                            <button
                              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={!authAdminReady}
                            >
                              {authAdminReady ? "Reset password" : "Service role key required"}
                            </button>
                          </form>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
      />
    </label>
  );
}
