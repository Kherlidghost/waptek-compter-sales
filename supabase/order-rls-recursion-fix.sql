-- Order RLS recursion fix for production Supabase.
-- Run this in Supabase Production SQL Editor if reports/orders show:
-- "infinite recursion detected in policy for relation orders/order_items".

create or replace function public.current_user_owns_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.profile_id = (select auth.uid())
  )
$$;

create or replace function public.current_user_can_read_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (
        o.profile_id = (select auth.uid())
        or public.current_user_role() = 'admin'
        or (
          public.current_user_role() in ('manager', 'cashier')
          and o.branch_id = public.current_user_branch_id()
        )
        or exists (
          select 1
          from public.order_items oi
          where oi.order_id = o.id
            and oi.vendor_id = public.current_vendor_id()
        )
      )
  )
$$;

create or replace function public.current_user_can_review_order_payment(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (
        public.current_user_role() = 'admin'
        or (
          public.current_user_role() = 'cashier'
          and o.branch_id = public.current_user_branch_id()
        )
      )
  )
$$;

revoke execute on function public.current_user_owns_order(uuid) from public, anon;
revoke execute on function public.current_user_can_read_order(uuid) from public, anon;
revoke execute on function public.current_user_can_review_order_payment(uuid) from public, anon;
grant execute on function public.current_user_owns_order(uuid) to authenticated;
grant execute on function public.current_user_can_read_order(uuid) to authenticated;
grant execute on function public.current_user_can_review_order_payment(uuid) to authenticated;

drop policy if exists "customers read own orders" on public.orders;
drop policy if exists "vendors read orders containing own products" on public.orders;
drop policy if exists "staff read branch orders" on public.orders;
drop policy if exists "read permitted orders" on public.orders;
create policy "read permitted orders" on public.orders
for select
to authenticated
using (public.current_user_can_read_order(id));

drop policy if exists "customers create order items" on public.order_items;
drop policy if exists "customers read own order items" on public.order_items;
drop policy if exists "vendors read own order items" on public.order_items;
drop policy if exists "staff read order items" on public.order_items;
drop policy if exists "customers create permitted order items" on public.order_items;
drop policy if exists "read permitted order items" on public.order_items;
create policy "customers create permitted order items" on public.order_items
for insert
to authenticated
with check (public.current_user_owns_order(order_id));

create policy "read permitted order items" on public.order_items
for select
to authenticated
using (public.current_user_can_read_order(order_id));

drop policy if exists "order event visibility" on public.order_events;
create policy "order event visibility" on public.order_events
for select
to authenticated
using (public.current_user_can_read_order(order_id));

drop policy if exists "create permitted order events" on public.order_events;
drop policy if exists "staff create order events" on public.order_events;
create policy "create permitted order events" on public.order_events
for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  and public.current_user_can_read_order(order_id)
);

drop policy if exists "customers read own receipts" on public.payment_receipts;
drop policy if exists "staff read receipts" on public.payment_receipts;
drop policy if exists "read permitted receipts" on public.payment_receipts;
create policy "read permitted receipts" on public.payment_receipts
for select
to authenticated
using (
  uploaded_by = (select auth.uid())
  or public.current_user_can_read_order(order_id)
);

drop policy if exists "cashiers review receipts" on public.payment_receipts;
create policy "cashiers review receipts" on public.payment_receipts
for update
to authenticated
using (public.current_user_can_review_order_payment(order_id))
with check (public.current_user_can_review_order_payment(order_id));
