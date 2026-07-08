-- Local POC seed data.
-- All demo accounts use password: Password123!

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'admin@computermarket.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin User","phone":"+2348000000001"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'manager@computermarket.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Amina Bello","phone":"+2348000000002"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'cashier@computermarket.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Musa Lawan","phone":"+2348000000003"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'vendor@computermarket.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Ibrahim Sani","phone":"+2348000000004"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'customer@computermarket.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Fatima Ahmed","phone":"+2348000000005"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  users.id,
  users.id::text,
  jsonb_build_object('sub', users.id::text, 'email', users.email, 'email_verified', true, 'phone_verified', false),
  'email',
  now(),
  now(),
  now()
from auth.users as users
where users.email in (
  'admin@computermarket.local',
  'manager@computermarket.local',
  'cashier@computermarket.local',
  'vendor@computermarket.local',
  'customer@computermarket.local'
)
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

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

insert into public.profiles (id, full_name, phone, role, branch_id)
values
  ('00000000-0000-4000-8000-000000000001', 'Admin User', '+2348000000001', 'admin', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002', 'Amina Bello', '+2348000000002', 'manager', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', 'Musa Lawan', '+2348000000003', 'cashier', '10000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000004', 'Ibrahim Sani', '+2348000000004', 'vendor', '10000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000005', 'Fatima Ahmed', '+2348000000005', 'customer', '10000000-0000-4000-8000-000000000003')
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  branch_id = excluded.branch_id,
  updated_at = now();

update public.branches
set manager_profile_id = '00000000-0000-4000-8000-000000000002'
where id = '10000000-0000-4000-8000-000000000001';

insert into public.categories (id, name, slug, description)
values
  ('20000000-0000-4000-8000-000000000001', 'Laptops', 'laptops', 'Business, student, gaming, and workstation laptops.'),
  ('20000000-0000-4000-8000-000000000002', 'Desktops', 'desktops', 'Office desktops, mini PCs, and custom builds.'),
  ('20000000-0000-4000-8000-000000000003', 'Accessories', 'accessories', 'Chargers, keyboards, mice, bags, RAM, SSDs, and monitors.'),
  ('20000000-0000-4000-8000-000000000004', 'Repair Services', 'repair-services', 'Diagnostics, screen replacement, board repair, and software fixes.')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description;

insert into public.vendors (
  id,
  profile_id,
  branch_id,
  business_name,
  business_phone,
  status,
  approved_by,
  approved_at
)
values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000001',
  'NorthTech Gadgets',
  '+2348000000104',
  'approved',
  '00000000-0000-4000-8000-000000000001',
  now()
)
on conflict (id) do update set
  profile_id = excluded.profile_id,
  branch_id = excluded.branch_id,
  business_name = excluded.business_name,
  business_phone = excluded.business_phone,
  status = excluded.status,
  approved_by = excluded.approved_by,
  approved_at = excluded.approved_at;

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
    '30000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
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
    '30000000-0000-4000-8000-000000000001',
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

insert into public.product_images (id, product_id, storage_path, alt_text, is_primary)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'seed/hp-elitebook-840-g6.webp', 'HP EliteBook 840 G6 laptop', true),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 'seed/dell-latitude-5410.webp', 'Dell Latitude 5410 laptop', true),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'seed/logitech-wireless-combo.webp', 'Logitech wireless keyboard and mouse', true),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 'seed/lenovo-thinkcentre-m720q.webp', 'Lenovo ThinkCentre M720q desktop', true),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', 'seed/samsung-24-inch-monitor.webp', 'Samsung 24 inch monitor', true),
  ('50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000006', 'seed/laptop-diagnostic-service.webp', 'Laptop diagnostic service desk', true)
on conflict (id) do update set
  product_id = excluded.product_id,
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  is_primary = excluded.is_primary;

insert into public.inventory (product_id, branch_id, quantity, reorder_level)
values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 9, 3),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 5, 2),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 32, 8),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 7, 2),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 14, 4),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', 50, 10)
on conflict (product_id, branch_id) do update set
  quantity = excluded.quantity,
  reorder_level = excluded.reorder_level,
  updated_at = now();

insert into public.carts (id, profile_id, status)
values ('60000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', 'active')
on conflict (id) do update set
  profile_id = excluded.profile_id,
  status = excluded.status,
  updated_at = now();

insert into public.cart_items (cart_id, product_id, quantity)
values
  ('60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1),
  ('60000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 1)
on conflict (cart_id, product_id) do update set
  quantity = excluded.quantity;

insert into public.orders (
  id,
  order_number,
  profile_id,
  branch_id,
  customer_name,
  customer_phone,
  customer_email,
  status,
  total,
  support_note
)
values
  (
    '70000000-0000-4000-8000-000000000001',
    'ORD-2407-001',
    '00000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    'Fatima Ahmed',
    '+2348000000005',
    'customer@computermarket.local',
    'receipt_uploaded',
    313500,
    'Customer uploaded a transfer receipt and is waiting for cashier review.'
  )
on conflict (id) do update set
  order_number = excluded.order_number,
  profile_id = excluded.profile_id,
  branch_id = excluded.branch_id,
  customer_name = excluded.customer_name,
  customer_phone = excluded.customer_phone,
  customer_email = excluded.customer_email,
  status = excluded.status,
  total = excluded.total,
  support_note = excluded.support_note,
  updated_at = now();

insert into public.order_items (id, order_id, product_id, vendor_id, quantity, unit_price)
values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 285000),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 1, 28500)
on conflict (id) do update set
  order_id = excluded.order_id,
  product_id = excluded.product_id,
  vendor_id = excluded.vendor_id,
  quantity = excluded.quantity,
  unit_price = excluded.unit_price;

insert into public.payment_receipts (id, order_id, uploaded_by, storage_path, amount, status)
values (
  '80000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000005',
  'seed/ord-2407-001-receipt.pdf',
  313500,
  'pending'
)
on conflict (id) do update set
  order_id = excluded.order_id,
  uploaded_by = excluded.uploaded_by,
  storage_path = excluded.storage_path,
  amount = excluded.amount,
  status = excluded.status;

insert into public.wishlists (profile_id, product_id)
values
  ('00000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005')
on conflict (profile_id, product_id) do nothing;

insert into public.reviews (profile_id, product_id, rating, comment, is_approved)
values
  ('00000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', 5, 'Clean laptop and quick pickup from Yola branch.', true),
  ('00000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000003', 4, 'Keyboard and mouse worked well for office setup.', true)
on conflict (profile_id, product_id) do update set
  rating = excluded.rating,
  comment = excluded.comment,
  is_approved = excluded.is_approved;

insert into public.notifications (id, profile_id, channel, recipient, message, status)
values
  ('90000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', 'email', 'customer@computermarket.local', 'Order ORD-2407-001 received. Please wait for cashier confirmation.', 'sent_simulated'),
  ('90000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'dashboard', 'cashier@computermarket.local', 'Receipt pending review for order ORD-2407-001.', 'queued'),
  ('90000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'whatsapp', '+2348000000004', 'Vendor alert: customer order ORD-2407-001 is awaiting payment confirmation.', 'queued')
on conflict (id) do update set
  profile_id = excluded.profile_id,
  channel = excluded.channel,
  recipient = excluded.recipient,
  message = excluded.message,
  status = excluded.status;
