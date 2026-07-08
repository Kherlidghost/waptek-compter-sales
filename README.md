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
```

`SUPABASE_SERVICE_ROLE_KEY` is not required for the current MVP. Do not add it to client components and never prefix it with `NEXT_PUBLIC_`.

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
4. Run `supabase/seed.sql`.
5. Confirm these Storage buckets exist:
   - `product-images` public bucket, max 5 MB, image MIME types
   - `payment-receipts` private bucket, max 5 MB, image/PDF MIME types
6. Confirm RLS is enabled on all public tables.
7. Confirm the storage object policies from `schema.sql` exist for product images and payment receipts.

The schema file creates tables, enums, indexes, triggers, storage buckets, grants, and RLS policies. If a bucket already exists, keep it and verify its public/private setting matches the list above.

## Demo Accounts

All seeded demo accounts use:

```text
Password123!
```

| Role | Email | Route |
| --- | --- | --- |
| Admin | `admin@computermarket.local` | `/admin` |
| Manager | `manager@computermarket.local` | `/manager` |
| Cashier | `cashier@computermarket.local` | `/cashier` |
| Vendor | `vendor@computermarket.local` | `/vendor` |
| Customer | `customer@computermarket.local` | `/products`, `/cart`, `/checkout`, `/orders` |

Use `/login` and then `/dashboard` to verify role-based routing.

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
4. Sign in as `customer@computermarket.local`.
5. Open `/cart`, then `/checkout`.
6. Fill customer details and upload a receipt image/PDF.
7. Submit checkout and confirm redirect to `/order-confirmation?order=...`.
8. Open `/orders` as the customer and confirm the new order appears.
9. Sign in as `cashier@computermarket.local`.
10. Open `/cashier`, open the uploaded receipt, then confirm or reject payment.
11. Sign in as `admin@computermarket.local` and confirm the online order status panel shows the updated status.
12. Sign in as `manager@computermarket.local` and confirm the order status is visible.
13. Sign in as `vendor@computermarket.local` and confirm vendor-visible order status and online product upload.
14. From `/vendor`, create a product with an uploaded image and confirm the image lands in the `product-images` bucket.
15. Open `/repairs` and submit a repair request.

## Current MVP Notes

- Payment is manual bank transfer only.
- Receipt upload uses the private Supabase Storage bucket `payment-receipts`.
- Product image upload uses the public Supabase Storage bucket `product-images`.
- Homepage, categories, product listing, and product details read live Supabase products first, with seed products only as an empty-database fallback.
- Cashier payment review updates `payment_receipts` and `orders` online.
- Advanced dashboards still include local demo controls for some management actions; the critical order/payment path is wired to Supabase.
- Email and WhatsApp are simulated in UI/dashboard logs only. No real provider API is called.
