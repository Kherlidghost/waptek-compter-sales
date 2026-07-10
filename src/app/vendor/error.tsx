"use client";

import { DashboardErrorFallback } from "@/components/DashboardErrorFallback";

export default function VendorDashboardError({ reset }: { reset: () => void }) {
  return <DashboardErrorFallback reset={reset} title="Vendor dashboard could not load" />;
}
