"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NotificationRow = {
  id: string;
  message: string;
  status: string;
  created_at: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notifications")
          .select("id, message, status, created_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!cancelled) setItems((data ?? []) as NotificationRow[]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready && items.length === 0) return null;

  return (
    <details className="relative">
      <summary
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700"
        aria-label="Open notifications"
      >
        <span aria-hidden="true">🔔</span>
        {items.length > 0 ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
        ) : null}
      </summary>
      <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-black text-slate-950">Notifications</p>
          <p className="text-xs text-slate-500">Latest marketplace updates</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                <p className="text-sm font-semibold text-slate-800">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </details>
  );
}

