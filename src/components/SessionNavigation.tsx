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
      <Link className={`rounded-md px-3 py-2 font-semibold hover:bg-ink-50 ${className}`} href="/login">
        Sign In
      </Link>
    );
  }

  if (mode === "mobile") {
    return (
      <div className={`grid gap-2 ${className}`}>
        <Link className="rounded-md px-3 py-2 font-semibold hover:bg-ink-50" href={user.home}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} dashboard
        </Link>
        <p className="px-3 text-xs font-semibold text-ink-500">{user.email}</p>
        <button
          className="rounded-md bg-primary-700 px-3 py-2 text-left text-sm font-bold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
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
          <p className="font-bold capitalize text-ink-950">{user.role}</p>
          <p className="text-ink-500">{user.email}</p>
        </div>
        <button
          className="rounded-md bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
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
      <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-semibold hover:bg-ink-50">
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-72 rounded-md border border-ink-200 bg-white p-3 text-sm shadow-lg">
        <p className="font-bold text-ink-950">{user.email}</p>
        <p className="mt-1 capitalize text-ink-500">{user.role}</p>
        <Link className="mt-3 block rounded-md px-3 py-2 font-semibold hover:bg-ink-50" href={user.home}>
          Dashboard
        </Link>
        <button
          className="mt-2 w-full rounded-md bg-primary-700 px-3 py-2 text-left text-sm font-bold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
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
