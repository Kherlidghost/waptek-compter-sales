-- Production helper: update WAPTEK COMPUTER SERVICES branding defaults and category names.
-- Run this in the Supabase Production SQL Editor if the live database still shows old marketplace category labels.

update public.company_settings
set
  company_name = 'WAPTEK COMPUTER SERVICES',
  support_email = 'support@waptekcomputerservices.com',
  about_text = 'Sales of Computers & Repairs.',
  updated_at = now()
where id = 1;

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
