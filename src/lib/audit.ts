/**
 * Audit log helper — server-only.
 * Call writeAuditLog from server actions to record sensitive staff events.
 * Never log passwords, secret keys, receipt contents, or full card data.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "staff_account_created"
  | "staff_account_updated"
  | "staff_password_reset"
  | "staff_role_changed"
  | "staff_branch_changed"
  | "vendor_approved"
  | "vendor_rejected"
  | "vendor_suspended"
  | "vendor_reactivated"
  | "vendor_profile_updated"
  | "product_created"
  | "product_updated"
  | "product_status_changed"
  | "product_deleted"
  | "inventory_updated"
  | "stock_transferred"
  | "payment_confirmed"
  | "payment_rejected"
  | "order_status_changed"
  | "order_cancelled"
  | "order_branch_assigned"
  | "company_settings_changed"
  | "bank_settings_changed"
  | "marketplace_settings_changed"
  | "branch_settings_changed"
  | "user_administration_changed";

export type AuditEntry = {
  actorId: string;
  actorRole: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  branchId?: string | null;
  /** Safe, non-sensitive context. No passwords, keys, or PII beyond IDs. */
  metadata?: Record<string, unknown>;
};

/**
 * Write an audit log entry. Silently swallows errors so a logging failure
 * never blocks a business operation.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      branch_id: entry.branchId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // Audit log failures must never break the main operation.
  }
}
