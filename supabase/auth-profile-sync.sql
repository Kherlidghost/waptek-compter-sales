-- Supabase Auth/Profile sync helper
--
-- Use this file only after creating the demo users in:
-- Supabase Dashboard -> Authentication -> Users -> Add user
--
-- Password for all demo users:
-- Password123!
--
-- The app authenticates against auth.users. The profile rows must use the
-- same UUID as auth.users.id. Do not insert fake UUIDs into profiles for
-- production users. Run the SELECT below first to inspect the real UUIDs.

select
  id as auth_user_id,
  email
from auth.users
where email in (
  'seekergur@gmail.com',
  'captainshadow331@gmail.com',
  'hauwaadamuyau6@gmail.com',
  'whiteamigo89@gmail.com',
  'scotfield382@gmail.com'
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
--       'seekergur@gmail.com',
--       'captainshadow331@gmail.com',
--       'hauwaadamuyau6@gmail.com',
--       'whiteamigo89@gmail.com',
--       'scotfield382@gmail.com'
--     )
--   );

-- Ensure demo branches exist before assigning branch_id values.

insert into public.branches (id, name, state, city, address)
values
  ('10000000-0000-4000-8000-000000000001', 'Yola Main Branch', 'Adamawa', 'Yola', 'Jimeta commercial area'),
  ('10000000-0000-4000-8000-000000000002', 'Damaturu Service Hub', 'Yobe', 'Damaturu', 'Central business district'),
  ('10000000-0000-4000-8000-000000000003', 'Maiduguri Sales Office', 'Borno', 'Maiduguri', 'Post Office area')
on conflict (id) do update set
  name = excluded.name,
  state = excluded.state,
  city = excluded.city,
  address = excluded.address;

-- Upsert profile rows using the real Auth UUIDs.

insert into public.profiles (id, full_name, phone, role, branch_id)
select
  users.id,
  case users.email
    when 'seekergur@gmail.com' then 'Admin User'
    when 'captainshadow331@gmail.com' then 'Manager User'
    when 'hauwaadamuyau6@gmail.com' then 'Cashier User'
    when 'whiteamigo89@gmail.com' then 'Vendor User'
    when 'scotfield382@gmail.com' then 'Customer User'
  end as full_name,
  case users.email
    when 'seekergur@gmail.com' then '+2348000000001'
    when 'captainshadow331@gmail.com' then '+2348000000002'
    when 'hauwaadamuyau6@gmail.com' then '+2348000000003'
    when 'whiteamigo89@gmail.com' then '+2348000000004'
    when 'scotfield382@gmail.com' then '+2348000000005'
  end as phone,
  case users.email
    when 'seekergur@gmail.com' then 'admin'::public.user_role
    when 'captainshadow331@gmail.com' then 'manager'::public.user_role
    when 'hauwaadamuyau6@gmail.com' then 'cashier'::public.user_role
    when 'whiteamigo89@gmail.com' then 'vendor'::public.user_role
    when 'scotfield382@gmail.com' then 'customer'::public.user_role
  end as role,
  case users.email
    when 'hauwaadamuyau6@gmail.com' then (select id from public.branches where state = 'Yobe' limit 1)
    when 'scotfield382@gmail.com' then (select id from public.branches where state = 'Borno' limit 1)
    else (select id from public.branches where state = 'Adamawa' limit 1)
  end as branch_id
from auth.users as users
where users.email in (
  'seekergur@gmail.com',
  'captainshadow331@gmail.com',
  'hauwaadamuyau6@gmail.com',
  'whiteamigo89@gmail.com',
  'scotfield382@gmail.com'
)
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  branch_id = excluded.branch_id,
  updated_at = now();

update public.branches
set manager_profile_id = (select id from auth.users where email = 'captainshadow331@gmail.com')
where state = 'Adamawa';

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
where vendor_user.email = 'whiteamigo89@gmail.com'
  and admin_user.email = 'seekergur@gmail.com'
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
  'seekergur@gmail.com',
  'captainshadow331@gmail.com',
  'hauwaadamuyau6@gmail.com',
  'whiteamigo89@gmail.com',
  'scotfield382@gmail.com'
)
order by users.email;
