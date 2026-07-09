-- Vendor Management & Approval System upgrade for production Supabase.
-- Run this in Supabase Production SQL Editor before using the full vendor management workflow.

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'vendor_status' and e.enumlabel = 'suspended'
  ) then
    alter type public.vendor_status add value 'suspended';
  end if;

  if not exists (
    select 1 from pg_type t join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'vendor_status' and e.enumlabel = 'inactive'
  ) then
    alter type public.vendor_status add value 'inactive';
  end if;
end $$;

alter table public.vendors
  add column if not exists owner_name text,
  add column if not exists business_email text,
  add column if not exists business_address text,
  add column if not exists state text,
  add column if not exists city text,
  add column if not exists business_type text,
  add column if not exists national_id_or_cac text,
  add column if not exists profile_photo_path text,
  add column if not exists business_logo_path text,
  add column if not exists rejection_reason text,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists reactivated_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists vendors_business_name_idx on public.vendors(business_name);
create index if not exists vendors_state_city_idx on public.vendors(state, city);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vendor-assets', 'vendor-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "public reads vendor assets" on storage.objects;
create policy "public reads vendor assets" on storage.objects
for select
to anon, authenticated
using (bucket_id = 'vendor-assets');

drop policy if exists "vendors upload own vendor assets" on storage.objects;
create policy "vendors upload own vendor assets" on storage.objects
for insert
to authenticated
with check (bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "vendors update own vendor assets" on storage.objects;
create policy "vendors update own vendor assets" on storage.objects
for update
to authenticated
using (bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'vendor-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "vendors delete own vendor assets" on storage.objects;
create policy "vendors delete own vendor assets" on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vendor-assets'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.current_user_role() = 'admin'
  )
);
