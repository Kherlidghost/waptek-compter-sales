"use client";

import { usePathname } from "next/navigation";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";

const STAFF_PREFIXES = ["/admin", "/manager", "/cashier", "/vendor", "/dashboard"];

export function WhatsAppFloatingButtonGuard({ number }: { number: string }) {
  const pathname = usePathname();
  const isStaffPage = STAFF_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isStaffPage) return null;
  return <WhatsAppFloatingButton number={number} />;
}
