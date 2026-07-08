"use client";

import { useEffect, useState } from "react";
import { notificationsChangedEvent, readNotificationLog, type SimulatedNotification } from "@/lib/notification-flow";

export function NotificationLog({ title = "Simulated notification logs" }: { title?: string }) {
  const [log, setLog] = useState<SimulatedNotification[]>([]);

  useEffect(() => {
    setLog(readNotificationLog());
    const refresh = () => setLog(readNotificationLog());

    window.addEventListener(notificationsChangedEvent, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(notificationsChangedEvent, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">Local email, WhatsApp, and dashboard messages. No real APIs are called.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{log.length} messages</span>
      </div>

      <div className="grid gap-3">
        {log.map((entry) => (
          <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">
                  {entry.channel} · {entry.status.replaceAll("_", " ")} · {entry.source}
                </p>
                <p className="mt-2 font-semibold text-slate-950">{entry.recipient}</p>
              </div>
              <p className="text-xs text-slate-500">{entry.createdAt}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{entry.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
