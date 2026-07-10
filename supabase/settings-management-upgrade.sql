-- Company Settings & Administration upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before using /admin/settings.

alter table public.branches
  add column if not exists phone text,
  add column if not exists support_contact text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.vendors
  add column if not exists business_description text;

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

insert into public.company_settings (id, company_name, support_email, support_phone, whatsapp_number, business_address, about_text, payment_instructions)
values (
  1,
  'WAPTEK COMPUTER SERVICES',
  'support@waptekcomputerservices.com',
  '+234 800 000 0001',
  '+234 800 000 0000',
  'Adamawa, Yobe, and Borno',
  'Computer marketplace for laptops, desktops, accessories, and professional repair services.',
  'Bank account details will be provided by support.'
)
on conflict (id) do nothing;

insert into public.marketplace_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.company_settings enable row level security;
alter table public.marketplace_settings enable row level security;

grant select on public.company_settings, public.marketplace_settings to anon, authenticated;
grant insert, update on public.company_settings, public.marketplace_settings to authenticated;
grant insert, update on public.branches to authenticated;

drop policy if exists "public reads company settings" on public.company_settings;
create policy "public reads company settings" on public.company_settings
for select to anon, authenticated using (true);

drop policy if exists "admin manages company settings" on public.company_settings;
create policy "admin manages company settings" on public.company_settings
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "public reads marketplace settings" on public.marketplace_settings;
create policy "public reads marketplace settings" on public.marketplace_settings
for select to anon, authenticated using (true);

drop policy if exists "admin manages marketplace settings" on public.marketplace_settings;
create policy "admin manages marketplace settings" on public.marketplace_settings
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "admin manages branches" on public.branches;
create policy "admin manages branches" on public.branches
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "manager updates assigned branch" on public.branches;
create policy "manager updates assigned branch" on public.branches
for update to authenticated
using (public.current_user_role() = 'manager' and id = public.current_user_branch_id())
with check (public.current_user_role() = 'manager' and id = public.current_user_branch_id());

drop policy if exists "vendors update own vendor profile" on public.vendors;
create policy "vendors update own vendor profile" on public.vendors
for update to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('settings-assets', 'settings-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "public reads settings assets" on storage.objects;
create policy "public reads settings assets" on storage.objects
for select to anon, authenticated
using (bucket_id = 'settings-assets');

drop policy if exists "admin uploads settings assets" on storage.objects;
create policy "admin uploads settings assets" on storage.objects
for insert to authenticated
with check (bucket_id = 'settings-assets' and public.current_user_role() = 'admin');

drop policy if exists "admin updates settings assets" on storage.objects;
create policy "admin updates settings assets" on storage.objects
for update to authenticated
using (bucket_id = 'settings-assets' and public.current_user_role() = 'admin')
with check (bucket_id = 'settings-assets' and public.current_user_role() = 'admin');

drop policy if exists "admin deletes settings assets" on storage.objects;
create policy "admin deletes settings assets" on storage.objects
for delete to authenticated
using (bucket_id = 'settings-assets' and public.current_user_role() = 'admin');
