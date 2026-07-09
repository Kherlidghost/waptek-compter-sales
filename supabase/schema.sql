create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'manager', 'cashier', 'vendor', 'customer');
create type public.vendor_status as enum ('pending', 'approved', 'rejected');
create type public.product_status as enum ('draft', 'active', 'inactive', 'rejected', 'archived');
create type public.cart_status as enum ('active', 'converted', 'abandoned');
create type public.order_status as enum ('awaiting_receipt', 'receipt_uploaded', 'paid_approved', 'payment_rejected', 'processing', 'ready_for_pickup', 'fulfilled', 'cancelled');
create type public.receipt_status as enum ('pending', 'confirmed', 'rejected');
create type public.repair_status as enum ('new', 'diagnosing', 'quoted', 'in_repair', 'ready', 'closed', 'cancelled');
create type public.notification_channel as enum ('email', 'whatsapp', 'dashboard');
create type public.notification_status as enum ('queued', 'sent_simulated', 'failed_simulated');

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null check (state in ('Adamawa', 'Yobe', 'Borno')),
  city text not null,
  address text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'customer',
  branch_id uuid references public.branches(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.branches
  add column manager_profile_id uuid references public.profiles(id);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  business_name text not null,
  business_phone text,
  status public.vendor_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  branch_id uuid not null references public.branches(id),
  name text not null,
  slug text not null unique,
  sku text,
  brand text,
  description text not null,
  specifications text,
  price numeric(12, 2) not null check (price >= 0),
  discount_price numeric(12, 2) check (discount_price is null or discount_price >= 0),
  warranty text,
  condition text not null check (condition in ('New', 'UK Used', 'Refurbished')),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  quantity integer not null default 0 check (quantity >= 0),
  reorder_level integer not null default 3 check (reorder_level >= 0),
  updated_at timestamptz not null default now(),
  unique (product_id, branch_id)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  status public.cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  profile_id uuid references public.profiles(id),
  branch_id uuid not null references public.branches(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  status public.order_status not null default 'awaiting_receipt',
  total numeric(12, 2) not null check (total >= 0),
  delivery_method text not null default 'Pickup',
  payment_method text not null default 'Manual bank transfer',
  cashier_note text,
  assigned_manager_id uuid references public.profiles(id),
  support_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  vendor_id uuid not null references public.vendors(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid references public.profiles(id),
  storage_path text not null,
  amount numeric(12, 2) check (amount >= 0),
  status public.receipt_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  branch_id uuid not null references public.branches(id),
  customer_name text not null,
  customer_phone text not null,
  device_model text not null,
  fault_description text not null,
  status public.repair_status not null default 'new',
  estimated_cost numeric(12, 2) check (estimated_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, product_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (profile_id, product_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  channel public.notification_channel not null,
  recipient text not null,
  message text not null,
  status public.notification_status not null default 'queued',
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_branch_id_idx on public.profiles(branch_id);
create index vendors_status_idx on public.vendors(status);
create index vendors_profile_id_idx on public.vendors(profile_id);
create index products_vendor_id_idx on public.products(vendor_id);
create index products_category_id_idx on public.products(category_id);
create index products_branch_id_idx on public.products(branch_id);
create index products_status_idx on public.products(status);
create unique index products_sku_unique_idx on public.products(sku) where sku is not null;
create index products_brand_idx on public.products(brand);
create index products_featured_idx on public.products(featured);
create index orders_profile_id_idx on public.orders(profile_id);
create index orders_branch_id_idx on public.orders(branch_id);
create index orders_status_idx on public.orders(status);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_vendor_id_idx on public.order_items(vendor_id);
create index order_events_order_id_idx on public.order_events(order_id);
create index order_events_created_at_idx on public.order_events(created_at);
create index payment_receipts_status_idx on public.payment_receipts(status);
create index repair_requests_branch_id_idx on public.repair_requests(branch_id);
create index notifications_profile_id_idx on public.notifications(profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger set_inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();
create trigger set_carts_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger set_repair_requests_updated_at before update on public.repair_requests for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_user_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.vendors where profile_id = (select auth.uid()) and status = 'approved'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'New customer'),
    new.raw_user_meta_data->>'phone',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.vendors enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.repair_requests enable row level security;
alter table public.wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.branches, public.categories, public.products, public.product_images, public.inventory, public.reviews to anon, authenticated;
grant select on public.vendors to anon;
grant select, insert, update, delete on public.profiles, public.vendors, public.carts, public.cart_items, public.orders, public.order_items, public.payment_receipts, public.repair_requests, public.wishlists, public.notifications to authenticated;
grant select, insert on public.order_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy "public reads branches" on public.branches for select to anon, authenticated using (true);
create policy "public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "public reads active products" on public.products for select to anon, authenticated using (status = 'active');
create policy "public reads product images" on public.product_images for select to anon, authenticated using (true);
create policy "public reads inventory" on public.inventory for select to anon, authenticated using (true);
create policy "public reads approved reviews" on public.reviews for select to anon, authenticated using (is_approved);

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "admins and managers read profiles" on public.profiles for select to authenticated using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "admins update profiles" on public.profiles for update to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "users create vendor application" on public.vendors for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "public reads approved vendors" on public.vendors for select to anon, authenticated using (status = 'approved');
create policy "vendors read own vendor row" on public.vendors for select to authenticated using ((select auth.uid()) = profile_id);
create policy "staff read vendors" on public.vendors for select to authenticated using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
);
create policy "admins approve vendors" on public.vendors for update to authenticated using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "approved vendors insert products" on public.products for insert to authenticated with check (vendor_id = public.current_vendor_id());
create policy "approved vendors update own products" on public.products for update to authenticated using (vendor_id = public.current_vendor_id()) with check (vendor_id = public.current_vendor_id());
create policy "staff manage products" on public.products for all to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
)
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
);

create policy "vendors manage own product images" on public.product_images for all to authenticated
using (product_id in (select id from public.products where vendor_id = public.current_vendor_id()))
with check (product_id in (select id from public.products where vendor_id = public.current_vendor_id()));
create policy "staff manage product images" on public.product_images for all to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and product_id in (select id from public.products where branch_id = public.current_user_branch_id())
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'manager'
    and product_id in (select id from public.products where branch_id = public.current_user_branch_id())
  )
);

create policy "staff manage inventory" on public.inventory for all to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
)
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
);
create policy "vendors read own inventory" on public.inventory for select to authenticated using (product_id in (select id from public.products where vendor_id = public.current_vendor_id()));
create policy "vendors manage own inventory" on public.inventory for insert to authenticated
with check (product_id in (select id from public.products where vendor_id = public.current_vendor_id()));

create policy "customers manage own carts" on public.carts for all to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "customers manage own cart items" on public.cart_items for all to authenticated
using (cart_id in (select id from public.carts where profile_id = (select auth.uid())))
with check (cart_id in (select id from public.carts where profile_id = (select auth.uid())));

create policy "customers create own orders" on public.orders for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "customers read own orders" on public.orders for select to authenticated using ((select auth.uid()) = profile_id);
create policy "vendors read orders containing own products" on public.orders for select to authenticated using (
  id in (select order_id from public.order_items where vendor_id = public.current_vendor_id())
);
create policy "staff read branch orders" on public.orders for select to authenticated using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() in ('manager', 'cashier') and branch_id = public.current_user_branch_id())
);
create policy "cashiers confirm branch orders" on public.orders for update to authenticated
using (public.current_user_role() = 'admin' or (public.current_user_role() = 'cashier' and branch_id = public.current_user_branch_id()))
with check (public.current_user_role() = 'admin' or (public.current_user_role() = 'cashier' and branch_id = public.current_user_branch_id()));

create policy "customers create order items" on public.order_items for insert to authenticated with check (
  order_id in (select id from public.orders where profile_id = (select auth.uid()))
);
create policy "customers read own order items" on public.order_items for select to authenticated using (
  order_id in (select id from public.orders where profile_id = (select auth.uid()))
);
create policy "vendors read own order items" on public.order_items for select to authenticated using (vendor_id = public.current_vendor_id());
create policy "staff read order items" on public.order_items for select to authenticated using (
  public.current_user_role() = 'admin'
  or order_id in (select id from public.orders where branch_id = public.current_user_branch_id())
);

create policy "order event visibility" on public.order_events for select to authenticated using (
  order_id in (
    select o.id
    from public.orders o
    where o.profile_id = (select auth.uid())
      or public.current_user_role() = 'admin'
      or (public.current_user_role() in ('manager', 'cashier') and o.branch_id = public.current_user_branch_id())
      or o.id in (select oi.order_id from public.order_items oi where oi.vendor_id = public.current_vendor_id())
  )
);
create policy "create permitted order events" on public.order_events for insert to authenticated with check (
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

create policy "customers upload own receipts" on public.payment_receipts for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and order_id in (select id from public.orders where profile_id = (select auth.uid()))
);
create policy "customers read own receipts" on public.payment_receipts for select to authenticated using (
  uploaded_by = (select auth.uid())
  or order_id in (select id from public.orders where profile_id = (select auth.uid()))
);
create policy "cashiers review receipts" on public.payment_receipts for update to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'cashier'
    and order_id in (select id from public.orders where branch_id = public.current_user_branch_id())
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'cashier'
    and order_id in (select id from public.orders where branch_id = public.current_user_branch_id())
  )
);
create policy "staff read receipts" on public.payment_receipts for select to authenticated using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() in ('manager', 'cashier')
    and order_id in (select id from public.orders where branch_id = public.current_user_branch_id())
  )
);

create policy "customers create repair requests" on public.repair_requests for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "customers read own repair requests" on public.repair_requests for select to authenticated using ((select auth.uid()) = profile_id);
create policy "staff manage repair requests" on public.repair_requests for all to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() in ('manager', 'cashier') and branch_id = public.current_user_branch_id())
)
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() in ('manager', 'cashier') and branch_id = public.current_user_branch_id())
);

create policy "customers manage own wishlists" on public.wishlists for all to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "customers manage own reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "customers update own reviews" on public.reviews for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy "staff moderate reviews" on public.reviews for update to authenticated using (public.current_user_role() in ('admin', 'manager')) with check (public.current_user_role() in ('admin', 'manager'));

create policy "users read own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = profile_id);
create policy "staff create notifications" on public.notifications for insert to authenticated with check (public.current_user_role() in ('admin', 'manager', 'cashier'));

create policy "public reads product image objects" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "vendors upload product image objects" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
create policy "staff and vendors delete product image objects" on storage.objects for delete to authenticated using (
  bucket_id = 'product-images'
  and (
    public.current_user_role() = 'admin'
    or name in (
      select pi.storage_path
      from public.product_images pi
      join public.products p on p.id = pi.product_id
      where p.vendor_id = public.current_vendor_id()
        or (public.current_user_role() = 'manager' and p.branch_id = public.current_user_branch_id())
    )
  )
);
create policy "users upload own receipt objects" on storage.objects for insert to authenticated with check (
  bucket_id = 'payment-receipts'
  and owner = (select auth.uid())
);
create policy "users read own receipt objects" on storage.objects for select to authenticated using (
  bucket_id = 'payment-receipts'
  and owner = (select auth.uid())
);
create policy "staff read receipt objects" on storage.objects for select to authenticated using (
  bucket_id = 'payment-receipts'
  and (
    public.current_user_role() = 'admin'
    or (
      public.current_user_role() in ('manager', 'cashier')
      and name in (
        select receipts.storage_path
        from public.payment_receipts as receipts
        join public.orders as orders on orders.id = receipts.order_id
        where orders.branch_id = public.current_user_branch_id()
      )
    )
  )
);
