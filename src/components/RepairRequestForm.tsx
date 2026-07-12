"use client";

import { useState } from "react";
import { branches } from "@/lib/marketplace-data";
import { readStoredRepairRequests, writeStoredRepairRequests } from "@/lib/repair-flow";
import type { RepairRequest } from "@/lib/types";

const initialForm = {
  customerName: "",
  customerPhone: "",
  deviceModel: "",
  branchId: "adamawa",
  faultDescription: "",
};

export function RepairRequestForm() {
  const [form, setForm] = useState(initialForm);
  const [createdRequest, setCreatedRequest] = useState<RepairRequest | null>(null);

  function submitRepairRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request: RepairRequest = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      branchId: form.branchId,
      deviceModel: form.deviceModel.trim(),
      faultDescription: form.faultDescription.trim(),
      status: "new",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (!request.customerName || !request.customerPhone || !request.deviceModel || !request.faultDescription) {
      return;
    }

    const nextRequests = [request, ...readStoredRepairRequests()];
    writeStoredRepairRequests(nextRequests);
    setCreatedRequest(request);
    setForm(initialForm);
  }

  return (
    <form onSubmit={submitRepairRequest} className="mt-6 grid gap-4">
      <input
        className="wcs-input"
        onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
        placeholder="Customer name"
        value={form.customerName}
      />
      <input
        className="wcs-input"
        onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
        placeholder="Phone number"
        value={form.customerPhone}
      />
      <input
        className="wcs-input"
        onChange={(event) => setForm((current) => ({ ...current, deviceModel: event.target.value }))}
        placeholder="Device model"
        value={form.deviceModel}
      />
      <select
        className="wcs-input"
        onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}
        value={form.branchId}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <textarea
        className="wcs-input min-h-32 rounded-2xl p-3"
        onChange={(event) => setForm((current) => ({ ...current, faultDescription: event.target.value }))}
        placeholder="Describe the fault"
        value={form.faultDescription}
      />
      <button className="btn-primary" type="submit">
        Create repair request
      </button>
      {createdRequest ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Repair request {createdRequest.id} submitted. Admin and cashier dashboards can now view it in this browser.
        </div>
      ) : null}
    </form>
  );
}
