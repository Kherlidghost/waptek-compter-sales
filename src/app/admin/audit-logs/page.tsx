import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { getAuthProfile, isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  branch_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string } | null;
  branches: { name: string; state: string } | null;
};

function formatAction(action: string) {
  return action.replaceAll("_", " ");
}

function formatMeta(meta: Record<string, unknown> | null) {
  if (!meta) return null;
  return Object.entries(meta)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const params = await searchParams;
  const pageSize = 50;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const actionFilter = params.action?.trim() || null;

  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen dashboard-shell px-4 py-8 text-slate-900">
        <DashboardSessionBar role="admin" />
        <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Supabase is not configured.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getAuthProfile(supabase, user.id) : null;

  if (!isAdmin(profile)) {
    return (
      <main className="min-h-screen dashboard-shell px-4 py-8 text-slate-900">
        <DashboardSessionBar role="admin" />
        <p className="mx-auto mt-6 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Only admin users can view audit logs.
        </p>
      </main>
    );
  }

  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, actor_role, action, entity_type, entity_id, branch_id, metadata, created_at, profiles(full_name), branches(name, state)")
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (actionFilter) query = query.eq("action", actionFilter);

  const { data: rows, error } = await query;
  const logs = (rows ?? []) as unknown as AuditRow[];

  const distinctActions = [
    "staff_account_created", "staff_account_updated", "staff_password_reset",
    "staff_role_changed", "vendor_approved", "vendor_rejected", "vendor_suspended",
    "vendor_reactivated", "payment_confirmed", "payment_rejected",
    "order_status_changed", "order_cancelled", "order_branch_assigned",
    "company_settings_changed", "marketplace_settings_changed",
    "branch_settings_changed", "user_administration_changed",
  ];

  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="admin" />

      <section className="premium-panel mx-auto max-w-7xl rounded-2xl p-6">
        <p className="text-sm font-black uppercase text-emerald-700">Security</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Audit Logs</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Immutable record of sensitive staff and admin actions. Logs cannot be edited or deleted.
            </p>
          </div>
          <a className="rounded-lg border border-slate-300 bg-white/80 px-4 py-3 text-sm font-black text-slate-900 hover:border-emerald-500" href="/admin/settings">
            Back to Settings
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl">
        <form className="flex flex-wrap items-end gap-3" method="GET">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Filter by action
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              name="action"
              defaultValue={actionFilter ?? ""}
            >
              <option value="">All actions</option>
              {distinctActions.map((a) => (
                <option key={a} value={a}>{formatAction(a)}</option>
              ))}
            </select>
          </label>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700">
            Filter
          </button>
          {actionFilter && (
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:border-slate-500" href="/admin/audit-logs">
              Clear
            </a>
          )}
        </form>
      </section>

      {error ? (
        <div className="mx-auto max-w-7xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Could not load audit logs. Run <span className="font-black">audit-log-upgrade.sql</span> in Supabase first.
        </div>
      ) : (
        <section className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No audit log entries found.
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const actor = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                  const branch = Array.isArray(log.branches) ? log.branches[0] : log.branches;
                  return (
                    <tr key={log.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {new Date(log.created_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {actor?.full_name ?? log.actor_id?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{log.actor_role ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 capitalize">{formatAction(log.action)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.entity_type ? (
                          <span>{log.entity_type}{log.entity_id ? <span className="ml-1 text-xs text-slate-400">#{log.entity_id.slice(0, 8)}</span> : null}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {branch ? `${branch.name} (${branch.state})` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatMeta(log.metadata) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {logs.length === pageSize && (
            <div className="flex justify-end border-t border-slate-200 p-4">
              <a
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:border-emerald-500"
                href={`/admin/audit-logs?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
              >
                Next page →
              </a>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
