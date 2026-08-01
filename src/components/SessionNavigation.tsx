"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

type AuthSummary = {
  email: string;
  role: UserRole;
  home: string;
};

type SessionNavigationProps = {
  user: AuthSummary | null;
  className?: string;
  mode?: "desktop" | "mobile" | "dashboard";
};

function clearAuthCache() {
  const authKeyParts = ["supabase.auth.token", "auth-token", "auth.user", "auth.profile", "auth.role"];

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (!key) continue;

        const isSupabaseSessionKey = key.startsWith("sb-") && key.endsWith("-auth-token");
        const isAppAuthKey = authKeyParts.some((part) => key.includes(part));

        if (isSupabaseSessionKey || isAppAuthKey) {
          storage.removeItem(key);
        }
      }
    } catch {
      storage.clear();
    }
  });
}

export function SessionNavigation({ user, className = "", mode = "desktop" }: SessionNavigationProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setIsSigningOut(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();
      clearAuthCache();

      if (signOutError) {
        setError(signOutError.message || "Sign out failed. Please try again.");
      }

      await fetch("/auth/logout", { method: "POST", credentials: "include" });
      router.refresh();
      window.location.assign("/?signed_out=1");
    } catch {
      clearAuthCache();
      router.refresh();
      window.location.assign("/?signed_out=1");
    }
  }

  if (!user) {
    return (
      <Link className={`btn btn-outline px-4 py-2 ${className}`} href="/login">
        Sign In
      </Link>
    );
  }

  if (mode === "mobile") {
    return (
      <div className={`grid gap-2 ${className}`}>
        <Link className="rounded-2xl px-3 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href={user.home}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} dashboard
        </Link>
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{user.email}</p>
        <button
          className="btn btn-primary justify-start px-3 py-2 text-left text-sm"
          disabled={isSigningOut}
          onClick={handleLogout}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Logout"}
        </button>
        {error ? <p className="px-3 text-sm font-semibold text-danger">{error}</p> : null}
      </div>
    );
  }

  if (mode === "dashboard") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <div className="text-sm">
          <p className="font-bold capitalize text-slate-950">{user.role}</p>
          <p className="text-slate-500">{user.email}</p>
        </div>
        <button
          className="btn btn-primary px-4 py-2 text-sm"
          disabled={isSigningOut}
          onClick={handleLogout}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Logout"}
        </button>
        {error ? <p className="basis-full text-sm font-semibold text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <details className={`relative ${className}`}>
      <summary className="cursor-pointer list-none rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-300 hover:text-primary-700">
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-72 rounded-3xl border border-slate-200 bg-white/95 p-3 text-sm shadow-2xl shadow-slate-900/10">
        <p className="font-bold text-slate-950">{user.email}</p>
        <p className="mt-1 capitalize text-slate-500">{user.role}</p>
        <Link className="mt-3 block rounded-2xl px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950" href={user.home}>
          Dashboard
        </Link>
        <button
          className="mt-2 w-full btn btn-primary justify-start px-3 py-2 text-left text-sm"
          disabled={isSigningOut}
          onClick={handleLogout}
          type="button"
        >
          {isSigningOut ? "Signing out..." : "Logout"}
        </button>
        {error ? <p className="mt-2 text-sm font-semibold text-danger">{error}</p> : null}
      </div>
    </details>
  );
}
