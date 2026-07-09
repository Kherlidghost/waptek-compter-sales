-- Product Management module upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before using the full product management UI.

alter table public.products
  add column if not exists sku text,
  add column if not exists brand text,
  add column if not exists discount_price numeric(12, 2) check (discount_price is null or discount_price >= 0),
  add column if not exists specifications text,
  add column if not exists warranty text,
  add column if not exists featured boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'product_status'
      and e.enumlabel = 'archived'
  ) then
    alter type public.product_status add value 'archived';
  end if;
end $$;

create unique index if not exists products_sku_unique_idx
  on public.products (sku)
  where sku is not null;

create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_featured_idx on public.products (featured);

drop policy if exists "staff and vendors delete product image objects" on storage.objects;
create policy "staff and vendors delete product image objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (
    public.current_user_role() = 'admin'
    or name in (
      select pi.storage_path
      from public.product_images pi
      join public.products p on p.id = pi.product_id
      where p.vendor_id = public.current_vendor_id()
        or (
          public.current_user_role() = 'manager'
          and p.branch_id = public.current_user_branch_id()
        )
    )
  )
);
