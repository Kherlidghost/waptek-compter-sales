# Authentication Security Guide

This project uses Supabase Auth for customer, vendor, cashier, manager, and admin login. Protected marketplace actions require both a valid Supabase session and a confirmed email address.

## How Email Confirmation Works

1. A customer registers from `/login`.
2. The app calls Supabase Auth `signUp` with an email confirmation redirect.
3. Supabase sends a confirmation email.
4. The user clicks the confirmation link.
5. Supabase redirects to `/auth/callback`.
6. The callback exchanges the confirmation code for a session and returns the user to a safe `next` URL or `/products`.
7. The middleware blocks protected pages until the user email is confirmed.

Protected pages include checkout, receipt upload, orders, wishlist, and all role dashboards.

## Enable Email Confirmation In Supabase

In the Supabase Dashboard, configure:

- Go to `Authentication` -> `Providers` -> `Email`.
- Enable `Confirm email`.
- Set the production `Site URL` to your Vercel domain, for example:
  - `https://YOUR-DOMAIN.vercel.app`
- Add redirect URLs:
  - `https://YOUR-DOMAIN.vercel.app/auth/callback`
  - `https://YOUR-DOMAIN.vercel.app/login`
  - `https://YOUR-DOMAIN.vercel.app/checkout`

For local development, also add:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/login`
- `http://localhost:3000/checkout`

## Manual Staff User Setup

Admin, manager, cashier, and vendor accounts should be created manually by the project owner or Supabase admin.

Recommended process:

1. Go to `Authentication` -> `Users` -> `Add user`.
2. Create the staff user with the real email address.
3. Confirm the user email from the dashboard if Supabase provides that option, or have the staff member confirm from their inbox.
4. Copy the Auth user UUID.
5. Create or update the matching row in `public.profiles` with the same UUID.
6. Set the correct `role`.
7. For manager and cashier users, set `branch_id`.

Example profile update:

```sql
insert into public.profiles (id, full_name, phone, role, branch_id)
values (
  'AUTH-USER-UUID-HERE',
  'Staff Name',
  '+2340000000000',
  'cashier',
  'adamawa'
)
on conflict (id) do update
set
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  branch_id = excluded.branch_id;
```

## Why Fake Seeded Auth Users Should Not Be Used

Supabase Auth owns user IDs and login credentials. Production systems must not depend on fake hard-coded UUIDs in `auth.users`.

Safe seed files may create:

- branches
- categories
- sample products
- inventory

Seed files should not directly insert fake users into `auth.users`.

## App-Level Security Behavior

The app checks email confirmation before allowing:

- `/checkout`
- `/orders`
- `/wishlist`
- `/admin`
- `/manager`
- `/cashier`
- `/vendor`

Public users can still:

- browse products
- search products
- view product details
- add items to guest cart

## Testing Checklist

1. Register a customer with a real email address.
2. Confirm the email from the inbox.
3. Login after confirmation.
4. Try checkout before confirmation and verify it redirects to login with a clear message.
5. Login as admin, manager, cashier, and vendor after each confirmed Auth user has a matching profile.
6. Verify unconfirmed users cannot access checkout, orders, wishlist, or role dashboards.
7. Verify guest browsing and guest cart still work.
8. Verify receipt upload, cashier confirmation, vendor product upload, logout, and role redirects still work.
