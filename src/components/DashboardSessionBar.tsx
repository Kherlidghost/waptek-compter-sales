import Link from "next/link";
import { isUserRole, roleHome } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";
import { SessionNavigation } from "./SessionNavigation";

export async function DashboardSessionBar({ role }: { role: UserRole }) {
  let userSummary = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const resolvedRole = isUserRole(profile?.role) ? profile.role : role;
      userSummary = {
        email: user.email ?? "Signed in",
        role: resolvedRole,
        home: roleHome[resolvedRole],
      };
    }
  }

  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <Link href="/" className="text-lg font-black text-slate-950">
          CompuMarket NG
        </Link>
        <p className="mt-1 text-sm capitalize text-slate-500">{role} workspace</p>
      </div>
      <SessionNavigation mode="dashboard" user={userSummary} />
    </header>
  );
}
