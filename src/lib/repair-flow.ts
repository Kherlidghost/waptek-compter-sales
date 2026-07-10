import type { RepairRequest, RepairStatus } from "./types";
import { repairRequests } from "./marketplace-data";

export const repairRequestsStorageKey = "waptek-repair-requests";

export const repairStatuses: RepairStatus[] = ["new", "diagnosing", "quoted", "in_repair", "ready", "closed", "cancelled"];

export function readStoredRepairRequests() {
  if (typeof window === "undefined") return repairRequests;

  const value = window.localStorage.getItem(repairRequestsStorageKey);
  if (!value) return repairRequests;

  try {
    return JSON.parse(value) as RepairRequest[];
  } catch {
    return repairRequests;
  }
}

export function writeStoredRepairRequests(requests: RepairRequest[]) {
  window.localStorage.setItem(repairRequestsStorageKey, JSON.stringify(requests));
}
