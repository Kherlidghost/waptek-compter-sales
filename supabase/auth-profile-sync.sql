-- Supabase Auth/Profile sync helper
--
-- Use this file only after creating the demo users in:
-- Supabase Dashboard -> Authentication -> Users -> Add user
--
-- Password for all demo users:
-- Password123!
--
-- The app authenticates against auth.users. The profile rows must use the
-- same UUID as auth.users.id. Run the SELECT below first to inspect the UUIDs.

select
  id as auth_user_id,
  email
from auth.users
where email in (
  'admin@computermarket.local',
  'manager@computermarket.local',
  'cashier@computermarket.local',
  'vendor@computermarket.local',
  'customer@computermarket.local'
)
order by email;

-- Optional: remove old mismatched profile rows for these demo users.
-- Review before running. Keep this commented until you are sure.
--
-- delete from public.profiles
-- where full_name in ('Admin User', 'Amina Bello', 'Musa Lawan', 'Ibrahim Sani', 'Fatima Ahmed')
--   and id not in (
--     select id from auth.users
--     where email in (
--       'admin@computermarket.local',
--       'manager@computermarket.local',
--       'cashier@computermarket.local',
--       'vendor@computermarket.local',
--       'customer@computermarket.local'
--     )
--   );

-- Upsert profile rows using the real Auth UUIDs.
-- This assumes branches already exist from supabase/schema.sql and supabase/seed.sql.

insert into public.profiles (id, full_name, phone, role, branch_id)
select
  users.id,
  case users.email
    when 'admin@computermarket.local' then 'Admin User'
    when 'manager@computermarket.local' then 'Amina Bello'
    when 'cashier@computermarket.local' then 'Musa Lawan'
    when 'vendor@computermarket.local' then 'Ibrahim Sani'
    when 'customer@computermarket.local' then 'Fatima Ahmed'
  end as full_name,
  case users.email
    when 'admin@computermarket.local' then '+2348000000001'
    when 'manager@computermarket.local' then '+2348000000002'
    when 'cashier@computermarket.local' then '+2348000000003'
    when 'vendor@computermarket.local' then '+2348000000004'
    when 'customer@computermarket.local' then '+2348000000005'
  end as phone,
  case users.email
    when 'admin@computermarket.local' then 'admin'::public.user_role
    when 'manager@computermarket.local' then 'manager'::public.user_role
    when 'cashier@computermarket.local' then 'cashier'::public.user_role
    when 'vendor@computermarket.local' then 'vendor'::public.user_role
    when 'customer@computermarket.local' then 'customer'::public.user_role
  end as role,
  case users.email
    when 'cashier@computermarket.local' then (select id from public.branches where state = 'Yobe' limit 1)
    when 'customer@computermarket.local' then (select id from public.branches where state = 'Borno' limit 1)
    else (select id from public.branches where state = 'Adamawa' limit 1)
  end as branch_id
from auth.users as users
where users.email in (
  'admin@computermarket.local',
  'manager@computermarket.local',
  'cashier@computermarket.local',
  'vendor@computermarket.local',
  'customer@computermarket.local'
)
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  branch_id = excluded.branch_id,
  updated_at = now();

-- Ensure the vendor account has a vendor row.

insert into public.vendors (
  profile_id,
  branch_id,
  business_name,
  business_phone,
  status,
  approved_by,
  approved_at
)
select
  vendor_user.id,
  (select id from public.branches where state = 'Adamawa' limit 1),
  'NorthTech Gadgets',
  '+2348000000104',
  'approved'::public.vendor_status,
  admin_user.id,
  now()
from auth.users as vendor_user
cross join auth.users as admin_user
where vendor_user.email = 'vendor@computermarket.local'
  and admin_user.email = 'admin@computermarket.local'
on conflict (profile_id) do update set
  branch_id = excluded.branch_id,
  business_name = excluded.business_name,
  business_phone = excluded.business_phone,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at;

-- Verify final role mapping.

select
  users.email,
  users.id as auth_user_id,
  profiles.id as profile_id,
  profiles.role
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
where users.email in (
  'admin@computermarket.local',
  'manager@computermarket.local',
  'cashier@computermarket.local',
  'vendor@computermarket.local',
  'customer@computermarket.local'
)
order by users.email;
