-- WAPTEK COMPUTER SERVICES missing feature upgrade
-- Run this in Supabase Production SQL Editor before testing the newly added
-- audit logs, stock movement, staff management, email/notification, and vendor
-- registration features.
--
-- This file is intentionally aligned with the current production schema:
-- vendors are linked through public.vendors.profile_id, not vendors.user_id.

create extension if not exists "pgcrypto";

-- Company and marketplace settings used by checkout, header/footer, and settings pages.
create table if not exists public.company_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'WAPTEK COMPUTER SERVICES',
  logo_path text,
  support_email text,
  support_phone text,
  whatsapp_number text,
  business_address text,
  about_text text,
  bank_name text,
  account_name text,
  account_number text,
  payment_instructions text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_settings (
  id integer primary key default 1 check (id = 1),
  allow_vendor_registration boolean not null default true,
  require_vendor_approval boolean not null default true,
  require_email_confirmation boolean not null default true,
  allow_guest_cart boolean not null default true,
  default_product_status text not null default 'draft' check (default_product_status in ('draft', 'active', 'inactive')),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists branch_id uuid references public.branches(id);
alter table public.profiles add column if not exists is_active boolean not null default true;

alter table public.vendors add column if not exists owner_name text;
alter table public.vendors add column if not exists business_email text;
alter table public.vendors add column if not exists business_address text;
alter table public.vendors add column if not exists state text;
alter table public.vendors add column if not exists city text;
alter table public.vendors add column if not exists business_type text;
alter table public.vendors add column if not exists business_description text;
alter table public.vendors add column if not exists national_id_or_cac text;
alter table public.vendors add column if not exists profile_photo_path text;
alter table public.vendors add column if not exists business_logo_path text;
alter table public.vendors add column if not exists approved_by uuid references public.profiles(id);
alter table public.vendors add column if not exists approved_at timestamptz;
alter table public.vendors add column if not exists rejection_reason text;
alter table public.vendors add column if not exists suspension_reason text;
alter table public.vendors add column if not exists suspended_at timestamptz;
alter table public.vendors add column if not exists reactivated_at timestamptz;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id text,
  branch_id uuid references public.branches(id) on delete set null,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_branch_id_idx on public.audit_logs(branch_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

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

create index if not exists inventory_movements_product_id_idx on public.inventory_movements(product_id);
create index if not exists inventory_movements_branch_id_idx on public.inventory_movements(branch_id);
create index if not exists inventory_movements_created_at_idx on public.inventory_movements(created_at desc);

insert into public.company_settings (id, company_name, support_email, support_phone, whatsapp_number, business_address, about_text, payment_instructions)
values (
  1,
  'WAPTEK COMPUTER SERVICES',
  'support@waptekcomputerservices.com',
  '+234 800 000 0001',
  '+234 800 000 0000',
  'Adamawa, Yobe, and Borno',
  'Sales of computers, accessories, spare parts, and professional repair services.',
  'Bank account details will be provided by support.'
)
on conflict (id) do nothing;

insert into public.marketplace_settings (id) values (1) on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vendor-assets', 'vendor-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('settings-assets', 'settings-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

alter table public.audit_logs enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.company_settings enable row level security;
alter table public.marketplace_settings enable row level security;

grant select, insert on public.audit_logs to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select on public.company_settings, public.marketplace_settings to anon, authenticated;
grant insert, update on public.company_settings, public.marketplace_settings to authenticated;

drop policy if exists "admin reads all audit logs" on public.audit_logs;
create policy "admin reads all audit logs" on public.audit_logs
  for select to authenticated
  using (public.current_user_role() = 'admin');

drop policy if exists "manager reads branch audit logs" on public.audit_logs;
create policy "manager reads branch audit logs" on public.audit_logs
  for select to authenticated
  using (
    public.current_user_role() = 'manager'
    and branch_id = public.current_user_branch_id()
  );

drop policy if exists "authenticated inserts own audit logs" on public.audit_logs;
create policy "authenticated inserts own audit logs" on public.audit_logs
  for insert to authenticated
  with check (actor_id = (select auth.uid()));

drop policy if exists "inventory movement visibility" on public.inventory_movements;
create policy "inventory movement visibility" on public.inventory_movements
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
    or product_id in (select id from public.products where vendor_id = public.current_vendor_id())
  );

drop policy if exists "create inventory movement" on public.inventory_movements;
create policy "create inventory movement" on public.inventory_movements
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and (
      public.current_user_role() = 'admin'
      or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch_id())
      or product_id in (select id from public.products where vendor_id = public.current_vendor_id())
    )
  );

drop policy if exists "public reads company settings" on public.company_settings;
create policy "public reads company settings" on public.company_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "admin manages company settings" on public.company_settings;
create policy "admin manages company settings" on public.company_settings
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "public reads marketplace settings" on public.marketplace_settings;
create policy "public reads marketplace settings" on public.marketplace_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "admin manages marketplace settings" on public.marketplace_settings;
create policy "admin manages marketplace settings" on public.marketplace_settings
  for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

drop policy if exists "users insert own notifications" on public.notifications;
create policy "users insert own notifications" on public.notifications
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

-- New orders created by app code now use WAP-YYYY-XXXXXX.
-- This trigger is a fallback for any insert that omits order_number.
create or replace function public.generate_wap_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'WAP-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 1000000)::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_wap_order_number on public.orders;
create trigger set_wap_order_number
  before insert on public.orders
  for each row execute function public.generate_wap_order_number();

