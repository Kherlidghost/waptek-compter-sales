-- Order Management module upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before using the full order management workflow.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'order_status'
      and e.enumlabel = 'ready_for_pickup'
  ) then
    alter type public.order_status add value 'ready_for_pickup';
  end if;
end $$;

alter table public.orders
  add column if not exists delivery_method text not null default 'Pickup',
  add column if not exists payment_method text not null default 'Manual bank transfer',
  add column if not exists cashier_note text,
  add column if not exists assigned_manager_id uuid references public.profiles(id);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_id_idx on public.order_events(order_id);
create index if not exists order_events_created_at_idx on public.order_events(created_at);

alter table public.order_events enable row level security;

grant select, insert on public.order_events to authenticated;

drop policy if exists "order event visibility" on public.order_events;
create policy "order event visibility" on public.order_events
for select
to authenticated
using (
  order_id in (
    select o.id
    from public.orders o
    where o.profile_id = (select auth.uid())
      or public.current_user_role() = 'admin'
      or (
        public.current_user_role() in ('manager', 'cashier')
        and o.branch_id = public.current_user_branch_id()
      )
      or o.id in (
        select oi.order_id
        from public.order_items oi
        where oi.vendor_id = public.current_vendor_id()
      )
  )
);

drop policy if exists "create permitted order events" on public.order_events;
drop policy if exists "staff create order events" on public.order_events;
create policy "create permitted order events" on public.order_events
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and (
    order_id in (
      select o.id
      from public.orders o
      where o.profile_id = (select auth.uid())
    )
    or public.current_user_role() = 'admin'
    or order_id in (
      select o.id
      from public.orders o
      where public.current_user_role() in ('manager', 'cashier')
        and o.branch_id = public.current_user_branch_id()
    )
  )
);
