-- Company-owned product upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before creating admin/manager
-- products without selecting a vendor.

alter table public.products
  alter column vendor_id drop not null;

alter table public.order_items
  alter column vendor_id drop not null;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'products'
      and constraint_name = 'products_vendor_id_fkey'
  ) then
    alter table public.products drop constraint products_vendor_id_fkey;
  end if;
end $$;

alter table public.products
  add constraint products_vendor_id_fkey
  foreign key (vendor_id)
  references public.vendors(id)
  on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'order_items'
      and constraint_name = 'order_items_vendor_id_fkey'
  ) then
    alter table public.order_items drop constraint order_items_vendor_id_fkey;
  end if;
end $$;

alter table public.order_items
  add constraint order_items_vendor_id_fkey
  foreign key (vendor_id)
  references public.vendors(id)
  on delete set null;

drop policy if exists "approved vendors insert products" on public.products;
create policy "approved vendors insert products" on public.products
for insert
to authenticated
with check (
  vendor_id is not null
  and vendor_id = public.current_vendor_id()
);

drop policy if exists "approved vendors update own products" on public.products;
create policy "approved vendors update own products" on public.products
for update
to authenticated
using (
  vendor_id is not null
  and vendor_id = public.current_vendor_id()
)
with check (
  vendor_id is not null
  and vendor_id = public.current_vendor_id()
);

drop policy if exists "staff manage products" on public.products;
create policy "staff manage products" on public.products
for all
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and branch_id = public.current_user_branch_id()
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and branch_id = public.current_user_branch_id()
  )
);
