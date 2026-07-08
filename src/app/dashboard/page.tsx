import { redirect } from "next/navigation";
import { isUserRole, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRouterPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-900">
        <section className="max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Supabase is not configured</h1>
          <p className="mt-3 leading-7 text-slate-600">
            Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then sign in to test role-based routing.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = isUserRole(data?.role) ? data.role : "customer";

  redirect(roleHome[role]);
}
