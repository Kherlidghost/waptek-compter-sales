"use client";

import { DashboardErrorFallback } from "@/components/DashboardErrorFallback";

export default function CashierDashboardError({ reset }: { reset: () => void }) {
  return <DashboardErrorFallback reset={reset} title="Cashier dashboard could not load" />;
}
