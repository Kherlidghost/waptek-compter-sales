"use client";

import { DashboardErrorFallback } from "@/components/DashboardErrorFallback";

export default function ManagerDashboardError({ reset }: { reset: () => void }) {
  return <DashboardErrorFallback reset={reset} title="Manager dashboard could not load" />;
}
