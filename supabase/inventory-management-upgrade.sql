-- Inventory & Branch Stock Management upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before using the full inventory workflow.

alter table public.inventory
  add column if not exists status text not null default 'active' check (status in ('active', 'damaged', 'archived')),
  add column if not exists damaged_quantity integer not null default 0 check (damaged_quantity >= 0),
  add column if not exists archived_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  profile_id uuid references public.profiles(id),
  role public.user_role,
  movement_type text not null check (movement_type in ('stock_added', 'stock_removed', 'sale', 'transfer_out', 'transfer_in', 'damaged', 'adjustment')),
  quantity integer not null check (quantity > 0),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  source_branch_id uuid not null references public.branches(id),
  destination_branch_id uuid not null references public.branches(id),
  quantity integer not null check (quantity > 0),
  reason text,
  status text not null default 'completed' check (status in ('pending', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists inventory_status_idx on public.inventory(status);
create index if not exists inventory_updated_at_idx on public.inventory(updated_at);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index if not exists inventory_movements_branch_id_idx on public.inventory_movements(branch_id);
create index if not exists inventory_movements_created_at_idx on public.inventory_movements(created_at);
create index if not exists stock_transfers_product_id_idx on public.stock_transfers(product_id);
create index if not exists stock_transfers_source_branch_id_idx on public.stock_transfers(source_branch_id);
create index if not exists stock_transfers_destination_branch_id_idx on public.stock_transfers(destination_branch_id);

alter table public.inventory_movements enable row level security;
alter table public.stock_transfers enable row level security;

grant select, insert on public.inventory_movements to authenticated;
grant select, insert, update on public.stock_transfers to authenticated;
grant select, insert, update, delete on public.inventory to authenticated;

drop policy if exists "vendors manage own inventory" on public.inventory;
create policy "vendors manage own inventory" on public.inventory for all to authenticated
using (product_id in (select id from public.products where vendor_id = public.current_vendor_id()))
with check (product_id in (select id from public.products where vendor_id = public.current_vendor_id()));

drop policy if exists "inventory movement visibility" on public.inventory_movements;
create policy "inventory movement visibility" on public.inventory_movements
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
  or product_id in (select id from public.products where vendor_id = public.current_vendor_id())
);

drop policy if exists "create inventory movement" on public.inventory_movements;
create policy "create inventory movement" on public.inventory_movements
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
    or product_id in (select id from public.products where vendor_id = public.current_vendor_id())
  )
);

drop policy if exists "stock transfer visibility" on public.stock_transfers;
create policy "stock transfer visibility" on public.stock_transfers
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and (
      source_branch_id = public.current_user_branch_id()
      or destination_branch_id = public.current_user_branch_id()
    )
  )
);

drop policy if exists "admin creates stock transfers" on public.stock_transfers;
create policy "admin creates stock transfers" on public.stock_transfers
for insert
to authenticated
with check (public.current_user_role() = 'admin' and created_by = (select auth.uid()));
