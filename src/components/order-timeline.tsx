import { StatusBadge } from "@/components/StatusBadge";
import { orderSteps } from "@/lib/customer-flow";

type TimelineEvent = {
  event_type: string;
  note: string | null;
  created_at: string;
};

export function OrderTimeline({ status, events = [] }: { status: string; events?: TimelineEvent[] }) {
  const currentIndex = Math.max(0, orderSteps.findIndex((step) => step.key === status));
  const eventByType = new Map(events.map((event) => [event.event_type, event]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Order timeline</h2>
          <p className="mt-1 text-sm text-slate-600">Track each stage from receipt upload to completion.</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-5">
        {orderSteps.map((step, index) => {
          const isDone = index <= currentIndex;
          const event = eventByType.get(step.key);
          return (
            <div key={step.key} className={`rounded-md border p-4 ${isDone ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"}`}>
              <div className={`mb-3 flex size-8 items-center justify-center rounded-full text-sm font-black ${isDone ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                {isDone ? "✓" : index + 1}
              </div>
              <p className="font-bold text-slate-950">{step.label}</p>
              <p className="mt-1 text-xs text-slate-500">
                {event ? new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" }) : isDone ? "Reached" : "Pending"}
              </p>
              {event?.note ? <p className="mt-2 text-xs leading-5 text-slate-600">{event.note}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

