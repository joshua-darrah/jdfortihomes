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
