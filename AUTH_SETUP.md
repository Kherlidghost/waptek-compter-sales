# Supabase Auth Setup

The app signs users in with Supabase Auth. A row in `public.profiles` is not enough for login. Each demo account must exist in **Authentication -> Users** first, and the matching `public.profiles.id` value must be the same UUID as `auth.users.id`.

Never create production staff/customer accounts by inserting fake UUIDs into `public.profiles`. Supabase Auth generates the real user UUID. The profile row must follow that UUID.

## Required Demo Users

Create these users with password:

```text
Password123!
```

| Email | Role |
| --- | --- |
| `seekergur@gmail.com` | `admin` |
| `captainshadow331@gmail.com` | `manager` |
| `hauwaadamuyau6@gmail.com` | `cashier` |
| `whiteamigo89@gmail.com` | `vendor` |
| `scotfield382@gmail.com` | `customer` |

## Create Users In Supabase Dashboard

1. Run `supabase/schema.sql` in SQL Editor first.
2. Open Supabase Dashboard.
3. Go to **Authentication -> Users**.
4. Click **Add user**.
5. Enter the email and password `Password123!`.
6. Confirm the email automatically if the option is shown.
7. Repeat for every required user above.
8. Run `supabase/auth-profile-sync.sql`.
9. Run `supabase/seed.sql`.
10. Open Table Editor -> `profiles`.
11. Confirm each profile row has the same UUID in `profiles.id` as the Auth user.

`supabase/auth-profile-sync.sql` reads `auth.users` by email and creates or updates the matching `profiles` rows with the right roles. It also creates or updates the approved demo vendor for the vendor account.

`supabase/seed.sql` is now limited to non-auth business seed data: branches, categories, and products. It intentionally does not write to Supabase Auth internals, `public.profiles`, or `public.vendors`.

## Fix Profile UUIDs

If a demo login fails but the profile row exists, the profile UUID probably does not match the Auth user UUID. Re-run the helper SQL in:

```text
supabase/auth-profile-sync.sql
```

Use it after all five users exist in Supabase Auth.

The helper:

- lists the real Auth UUIDs for the demo emails
- upserts `public.profiles` using those UUIDs
- creates or updates the approved vendor row for the vendor account
- shows the final email -> Auth UUID -> profile role mapping

The helper already uses the real role emails listed above. If a role owner
changes later, update `supabase/auth-profile-sync.sql` before running it again.

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
