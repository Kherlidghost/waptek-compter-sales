"use client";

import { DashboardErrorFallback } from "@/components/DashboardErrorFallback";

export default function DashboardRouterError({ reset }: { reset: () => void }) {
  return <DashboardErrorFallback reset={reset} title="Dashboard router could not load" />;
}
