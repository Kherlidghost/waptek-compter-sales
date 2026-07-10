"use client";

import { DashboardErrorFallback } from "@/components/DashboardErrorFallback";

export default function AdminDashboardError({ reset }: { reset: () => void }) {
  return <DashboardErrorFallback reset={reset} title="Admin dashboard could not load" />;
}
