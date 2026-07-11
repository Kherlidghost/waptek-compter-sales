-- Audit Log System for WAPTEK COMPUTER SERVICES
-- Run this in Supabase Production SQL Editor.
-- Idempotent: safe to run multiple times.

-- ── Audit log table ────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid references public.profiles(id) on delete set null,
  actor_role      text,
  action          text not null,
  entity_type     text,
  entity_id       text,
  branch_id       uuid references public.branches(id) on delete set null,
  metadata        jsonb,
  -- ip_address and user_agent are stored only when safely passed from server actions.
  -- Never store passwords, keys, or receipt contents here.
  ip_address      text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Index for common query patterns
create index if not exists audit_logs_actor_id_idx    on public.audit_logs(actor_id);
create index if not exists audit_logs_action_idx      on public.audit_logs(action);
create index if not exists audit_logs_entity_type_idx on public.audit_logs(entity_type);
create index if not exists audit_logs_branch_id_idx   on public.audit_logs(branch_id);
create index if not exists audit_logs_created_at_idx  on public.audit_logs(created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.audit_logs enable row level security;

-- Grant table-level permissions
grant select on public.audit_logs to authenticated;
grant insert on public.audit_logs to authenticated;

-- Admin sees all logs
drop policy if exists "admin reads all audit logs" on public.audit_logs;
create policy "admin reads all audit logs" on public.audit_logs
  for select to authenticated
  using (public.current_user_role() = 'admin');

-- Manager sees only logs for their branch
drop policy if exists "manager reads branch audit logs" on public.audit_logs;
create policy "manager reads branch audit logs" on public.audit_logs
  for select to authenticated
  using (
    public.current_user_role() = 'manager'
    and branch_id = public.current_user_branch_id()
  );

-- Any authenticated staff/vendor can insert their own audit events
drop policy if exists "authenticated inserts own audit logs" on public.audit_logs;
create policy "authenticated inserts own audit logs" on public.audit_logs
  for insert to authenticated
  with check (actor_id = (select auth.uid()));

-- No one can update or delete audit logs (immutable)
-- (No update/delete policies = no update/delete allowed)
