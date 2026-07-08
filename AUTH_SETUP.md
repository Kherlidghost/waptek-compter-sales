# Supabase Auth Setup

The app signs users in with Supabase Auth. A row in `public.profiles` is not enough for login. Each demo account must exist in **Authentication -> Users** first, and the matching `public.profiles.id` value must be the same UUID as `auth.users.id`.

## Required Demo Users

Create these users with password:

```text
Password123!
```

| Email | Role |
| --- | --- |
| `admin@computermarket.local` | `admin` |
| `manager@computermarket.local` | `manager` |
| `cashier@computermarket.local` | `cashier` |
| `vendor@computermarket.local` | `vendor` |
| `customer@computermarket.local` | `customer` |

## Create Users In Supabase Dashboard

1. Open Supabase Dashboard.
2. Go to **Authentication -> Users**.
3. Click **Add user**.
4. Enter the email and password `Password123!`.
5. Confirm the email automatically if the option is shown.
6. Repeat for every required user above.
7. Copy each user's Auth UUID from the Users table.
8. Open Table Editor -> `profiles`.
9. Confirm each profile row has the same UUID in `profiles.id`.

## Fix Profile UUIDs

If a demo login fails but the profile row exists, the profile UUID probably does not match the Auth user UUID. Run the helper SQL in:

```text
supabase/auth-profile-sync.sql
```

Use it after all five users exist in Supabase Auth.

## Registration Behavior

New customer registration uses `supabase.auth.signUp`. The database trigger `public.handle_new_user()` creates a `public.profiles` row automatically with role `customer`.

If a customer opens `/login?next=/checkout`, creates an account, and then signs in, the login form preserves `next=/checkout` and redirects the customer back to checkout.

## Role Redirects

After login:

- Admin -> `/admin`
- Manager -> `/manager`
- Cashier -> `/cashier`
- Vendor -> `/vendor`
- Customer with `next` -> the requested URL, for example `/checkout`
- Customer without `next` -> `/products`

## Important

Do not use a service role key in frontend code. This app only needs:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
