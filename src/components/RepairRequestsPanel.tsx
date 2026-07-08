"use client";

import { useEffect, useState } from "react";
import { formatNaira, getBranch } from "@/lib/marketplace-data";
import { readStoredRepairRequests, repairStatuses, writeStoredRepairRequests } from "@/lib/repair-flow";
import type { RepairRequest, RepairStatus } from "@/lib/types";

export function RepairRequestsPanel({ compact = false }: { compact?: boolean }) {
  const [requests, setRequests] = useState<RepairRequest[]>([]);

  useEffect(() => {
    setRequests(readStoredRepairRequests());
  }, []);

  function updateRequest(id: string, updates: Partial<RepairRequest>) {
    const nextRequests = requests.map((request) => (request.id === id ? { ...request, ...updates } : request));
    setRequests(nextRequests);
    writeStoredRepairRequests(nextRequests);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Repair service requests</h2>
          <p className="mt-1 text-sm text-slate-600">Submitted public repair requests for staff triage.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">{requests.length} requests</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Branch</th>
              {!compact ? <th className="px-4 py-3">Fault</th> : null}
              <th className="px-4 py-3">Estimate</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 font-semibold text-slate-950">{request.id}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{request.customerName}</p>
                  <p className="text-xs text-slate-500">{request.customerPhone}</p>
                </td>
                <td className="px-4 py-3">{request.deviceModel}</td>
                <td className="px-4 py-3">{getBranch(request.branchId)?.state}</td>
                {!compact ? <td className="max-w-xs px-4 py-3 text-slate-600">{request.faultDescription}</td> : null}
                <td className="px-4 py-3">
                  <input
                    className="h-9 w-28 rounded-md border border-slate-300 px-2"
                    inputMode="numeric"
                    onChange={(event) => updateRequest(request.id, { estimatedCost: Number(event.target.value) })}
                    placeholder="0"
                    value={request.estimatedCost ?? ""}
                  />
                  {request.estimatedCost ? <p className="mt-1 text-xs text-slate-500">{formatNaira(request.estimatedCost)}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-9 rounded-md border border-slate-300 px-2 capitalize"
                    onChange={(event) => updateRequest(request.id, { status: event.target.value as RepairStatus })}
                    value={request.status}
                  >
                    {repairStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
