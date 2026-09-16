# Deployment

## Vercel

Set these environment variables in the Vercel project:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_TOUR_FEE_GHS
NEXT_PUBLIC_PAYMENT_MOMO_NETWORK
NEXT_PUBLIC_PAYMENT_MOMO_NAME
NEXT_PUBLIC_PAYMENT_MOMO_NUMBER
NEXT_PUBLIC_PAYMENT_BANK_NAME
NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME
NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER
```

Use the service-role key only as a server-side environment variable.

## Supabase

Before accepting bookings, verify:

- the current schema is installed;
- storage buckets and policies exist;
- the private payment-proof bucket is not public;
- an administrator profile has role `admin`;
- agent accounts have the correct role and link;
- the direct booking assignment table exists; and
- the targeted indexes have been applied.

## Booking configuration

The booking API returns a configuration error when the server cannot access the required Supabase URL/service-role key. This normally means the Vercel environment variable is missing or the deployment has not been redeployed after adding it.

Manual payment details must also be configured before customers can submit paid tour requests.

## Branding verification

After deployment, check these URLs:

```text
/favicon.png
/apple-icon.png
/manifest.webmanifest
/google1d4e8f9270f4a1bc.html
/robots.txt
/sitemap.xml
```

Check the header and footer on:

- Safari iPhone;
- Safari iPad;
- Safari macOS;
- Chrome Android;
- Chrome desktop; and
- Firefox desktop.

## Production checks

Run locally before deployment:

```bash
npm run typecheck
npm run build
npm start
```

Then test:

- public listing search;
- property gallery and videos;
- booking submission;
- payment proof upload;
- admin login;
- booking assignment;
- agent login;
- listing editing;
- advertisement expiry;
- mobile navigation; and
- Apple home-screen icon/branding.

## Agent fees and commission migration

For an existing Supabase database, run `supabase/agent-fees-commission.sql` once after the existing agent/booking-assignment migrations. It adds optional per-listing agent fees, platform commission settings, booking financial snapshots, and automatic pending payout records.

The seeded commission rate is 15% as a configurable starting value. Change it from **Admin → Agents → Tour fees and commission** before launch if JDFortiHomes agrees on a different rate.

Manual payment details are still configured through the payment environment variables. They are only rendered inside the `/book` booking flow, not on public property pages or the homepage.
