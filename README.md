# CompuMarket NG MVP

Online MVP for a multi-vendor computer sales and repair marketplace in Nigeria. The deployment target is Vercel for the Next.js frontend and Supabase Free for Auth, Postgres, Storage, and row-level security.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, and Storage
- Manual bank transfer checkout with receipt upload
- Simulated email/WhatsApp/dashboard notifications only

## Environment Variables

Create `.env.local` locally and add the same variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is required for Admin Staff Management so the server can create manager/cashier Auth users. Add it only to Vercel environment variables and local `.env.local`; never expose it in client components and never prefix it with `NEXT_PUBLIC_`.

## Local Verification

```bash
npm install
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a new Supabase project on the Free plan.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Create the demo users in Supabase Dashboard -> Authentication -> Users. See `AUTH_SETUP.md`.
5. Run `supabase/auth-profile-sync.sql` to link real Auth UUIDs to profile roles and create the approved demo vendor.
6. Run `supabase/seed.sql` to load branches, categories, and sample products.
7. Confirm these Storage buckets exist:
   - `product-images` public bucket, max 5 MB, image MIME types
   - `payment-receipts` private bucket, max 5 MB, image/PDF MIME types
8. Confirm RLS is enabled on all public tables.
9. Confirm the storage object policies from `schema.sql` exist for product images and payment receipts.

The schema file creates tables, enums, indexes, triggers, storage buckets, grants, and RLS policies. If a bucket already exists, keep it and verify its public/private setting matches the list above.

## Demo Accounts

The app signs in through Supabase Auth. These users must exist in **Authentication -> Users** as well as in `public.profiles`. See `AUTH_SETUP.md` for the full setup and repair steps.

All seeded demo accounts use:

```text
Password123!
```

| Role | Email | Route |
| --- | --- | --- |
| Admin | `seekergur@gmail.com` | `/admin` |
| Manager | `captainshadow331@gmail.com` | `/manager` |
| Cashier | `hauwaadamuyau6@gmail.com` | `/cashier` |
| Vendor | `whiteamigo89@gmail.com` | `/vendor` |
| Customer | `scotfield382@gmail.com` | `/products`, `/cart`, `/checkout`, `/orders` |

Use `/login` to verify role-based routing. Staff users go directly to their role dashboard. Customers go to `/orders`, or back to `/checkout` when they started checkout as a guest.

### Auth User Setup

`supabase/seed.sql` does not create Auth users, profiles, or vendors, and it does not use fake profile UUIDs. Supabase Auth owns user IDs in production. Create the demo users first, then run the profile sync helper to map roles to the real Auth UUIDs:

1. Go to Supabase Dashboard -> Authentication -> Users.
2. Click **Add user**.
3. Create each email from the table above with password `Password123!`.
4. Confirm each email if Supabase shows that option.
5. Run `supabase/auth-profile-sync.sql`.
6. Run `supabase/seed.sql`.
7. In Table Editor -> `profiles`, confirm each user id exists with the correct role:
   - `admin`
   - `manager`
   - `cashier`
   - `vendor`
   - `customer`

## Vercel Deployment

1. Push the project to GitHub.
2. In Vercel, create a new project from the GitHub repository.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Add Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy.
8. In Supabase Auth settings, add the Vercel URL to allowed redirect URLs:
   - `https://your-vercel-domain.vercel.app/auth/callback`
   - your final custom domain callback URL when available

## Live MVP Test Checklist

1. Open `/` and confirm the public homepage loads.
2. Open `/products` and confirm product listing/search/filter UI loads.
3. Open a product details page from the listing.
4. Add a product to cart and open `/cart` as a guest.
5. Click checkout and confirm it redirects to `/login?next=/checkout`.
6. Sign in as `scotfield382@gmail.com` and confirm it returns to `/checkout`.
7. Fill customer details and upload a receipt image/PDF.
8. Submit checkout and confirm redirect to `/order-confirmation?order=...`.
9. Open `/orders` as the customer and confirm the new order appears.
10. Sign in as `hauwaadamuyau6@gmail.com`.
11. Open `/cashier`, open the uploaded receipt, then confirm or reject payment.
12. Sign in as `seekergur@gmail.com` and confirm the online order status panel shows the updated status.
13. Sign in as `captainshadow331@gmail.com` and confirm the order status is visible.
14. Sign in as `whiteamigo89@gmail.com` and confirm vendor-visible order status and online product upload.
15. From `/vendor`, create a product with an uploaded image and confirm the image lands in the `product-images` bucket.
16. Open `/repair` or `/repairs` and submit a repair request.

## Current MVP Notes

- Payment is manual bank transfer only.
- Receipt upload uses the private Supabase Storage bucket `payment-receipts`.
- Product image upload uses the public Supabase Storage bucket `product-images`.
- Homepage, categories, product listing, and product details read live Supabase products first, with seed products only as an empty-database fallback.
- Cashier payment review updates `payment_receipts` and `orders` online.
- Advanced dashboards still include local demo controls for some management actions; the critical order/payment path is wired to Supabase.
- Email and WhatsApp are simulated in UI/dashboard logs only. No real provider API is called.
