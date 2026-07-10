-- Marketplace seed data for non-auth business records only.
--
-- This file intentionally does not write to Supabase Auth internals,
-- public.profiles, or public.vendors. Supabase Auth users must be created in
-- the Supabase Dashboard, then linked to profiles with:
--
--   supabase/auth-profile-sync.sql
--
-- Seed scope:
-- - branches
-- - categories
-- - products
--
-- Product seed rows prefer an existing approved vendor. If no approved vendor
-- exists yet, the rows are inserted as company-owned products.

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

insert into public.categories (id, name, slug, description)
values
  ('20000000-0000-4000-8000-000000000001', 'Laptops', 'laptops', 'Business, student, gaming, and workstation laptops.'),
  ('20000000-0000-4000-8000-000000000002', 'Desktop Computers', 'desktops', 'Office desktops, mini PCs, workstations, and custom builds.'),
  ('20000000-0000-4000-8000-000000000003', 'Computer Accessories', 'accessories', 'Chargers, keyboards, mice, bags, RAM, SSDs, and monitors.'),
  ('20000000-0000-4000-8000-000000000004', 'Repair Services', 'repair-services', 'Diagnostics, screen replacement, board repair, and software fixes.'),
  ('20000000-0000-4000-8000-000000000005', 'Printers', 'printers', 'Office printers, ink systems, toners, and print accessories.'),
  ('20000000-0000-4000-8000-000000000006', 'Networking Equipment', 'networking-equipment', 'Routers, switches, cables, Wi-Fi devices, and network tools.'),
  ('20000000-0000-4000-8000-000000000007', 'Storage Devices', 'storage-devices', 'Hard drives, SSDs, flash drives, memory cards, and backup storage.'),
  ('20000000-0000-4000-8000-000000000008', 'Software', 'software', 'Operating systems, productivity tools, security software, and setup support.')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description;

do $$
declare
  seed_vendor_id uuid;
begin
  select id
  into seed_vendor_id
  from public.vendors
  where status = 'approved'
  order by created_at
  limit 1;

  if seed_vendor_id is null then
    raise notice 'No approved vendor found. Product seed will be company-owned.';
  end if;

  insert into public.products (
    id,
    vendor_id,
    category_id,
    branch_id,
    name,
    slug,
    description,
    price,
    condition,
    status
  )
  values
    (
      '40000000-0000-4000-8000-000000000001',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'HP EliteBook 840 G6',
      'hp-elitebook-840-g6',
      'Reliable UK-used business laptop for students, offices, and field teams.',
      285000,
      'UK Used',
      'active'
    ),
    (
      '40000000-0000-4000-8000-000000000002',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000003',
      'Dell Latitude 5410',
      'dell-latitude-5410',
      'Clean refurbished Dell laptop with warranty-ready stock tracking.',
      330000,
      'Refurbished',
      'active'
    ),
    (
      '40000000-0000-4000-8000-000000000003',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      'Logitech Wireless Keyboard and Mouse',
      'logitech-wireless-keyboard-mouse',
      'Durable wireless combo for home and office setups.',
      28500,
      'New',
      'active'
    ),
    (
      '40000000-0000-4000-8000-000000000004',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000003',
      'Lenovo ThinkCentre M720q',
      'lenovo-thinkcentre-m720q',
      'Compact desktop for POS, accounting, cyber cafe, and admin counters.',
      210000,
      'UK Used',
      'active'
    ),
    (
      '40000000-0000-4000-8000-000000000005',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000002',
      'Samsung 24 inch Monitor',
      'samsung-24-inch-monitor',
      'Full HD monitor for office setups and repair bench diagnostics.',
      95000,
      'New',
      'active'
    ),
    (
      '40000000-0000-4000-8000-000000000006',
      seed_vendor_id,
      '20000000-0000-4000-8000-000000000004',
      '10000000-0000-4000-8000-000000000003',
      'Laptop Diagnostic Service',
      'laptop-diagnostic-service',
      'Book a technician check for power, display, charging, overheating, or software faults.',
      10000,
      'New',
      'active'
    )
  on conflict (id) do update set
    vendor_id = excluded.vendor_id,
    category_id = excluded.category_id,
    branch_id = excluded.branch_id,
    name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    price = excluded.price,
    condition = excluded.condition,
    status = excluded.status,
    updated_at = now();
end $$;
