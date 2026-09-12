# JDFortiHomes

JDFortiHomes is an accommodation discovery and property-tour platform in Ghana. The current application is Ghana-focused and is designed to be extended as the inventory and service grow.

## Current stack

- Next.js 15
- React 19
- Plain CSS
- Supabase PostgreSQL
- Supabase Auth for administrator access
- Supabase Storage for listing media and private payment proofs
- Supabase Realtime for listing refreshes
- Next.js server route for public booking creation

## Important security change

Public customers no longer insert bookings directly into Supabase or upload payment proofs directly to the storage bucket. The booking form submits to `/api/bookings`, which validates the request on the server and uses the server-only `SUPABASE_SERVICE_ROLE_KEY` to create the booking and store the payment proof.

**Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_*` variable or commit it to GitHub.**

## Local setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Create a Supabase project.
4. Run the complete `supabase/schema.sql` in the Supabase SQL Editor.
5. Create `.env.local` from `.env.example`.
6. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TOUR_FEE_GHS`
   - the real manual payment details
7. Run `npm run dev`.
8. Open `/admin` and create an administrator account in Supabase Authentication.
9. Set that user's profile role to `admin`.

Example role update:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'YOUR_AUTH_USER_UUID';
```

## Manual payment configuration

The customer booking flow expects real payment instructions. Configure these environment variables before accepting bookings:

```env
NEXT_PUBLIC_TOUR_FEE_GHS=50
NEXT_PUBLIC_PAYMENT_MOMO_NETWORK=
NEXT_PUBLIC_PAYMENT_MOMO_NAME=
NEXT_PUBLIC_PAYMENT_MOMO_NUMBER=
NEXT_PUBLIC_PAYMENT_BANK_NAME=
NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME=
NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER=
```

The application intentionally does not contain fake account numbers or placeholder payment credentials.

## Booking flow

1. A customer opens a published property.
2. The customer selects a tour date/time and enters only the information needed to arrange the tour.
3. The customer makes the manually instructed tour-fee payment outside the application.
4. The customer uploads a JPG, PNG, WebP or PDF payment proof up to 5 MB.
5. The customer accepts the Terms of Service and Privacy Policy.
6. `/api/bookings` validates the request, checks that the property is published, uploads the proof to private storage, and creates the booking.
7. The customer receives a booking reference.
8. An administrator can open the booking in `/admin` to see the customer details, selected property, tour information, notes, consent record and a signed link/preview for the payment proof.

## Admin listing flow

Admins can:

- create, edit and delete listings;
- upload property photos and videos;
- set listing status;
- add property details and amenities;
- mark demonstration inventory clearly;
- record a media-rights note;
- confirm that the property information/media may be published;
- manage booking status; and
- export booking data to CSV.

Published listings cannot be created from the public site. Public users can only read published inventory through the RLS policy.

## Accessibility work included

The current codebase includes:

- skip navigation;
- semantic navigation and form labels;
- visible keyboard focus indicators;
- keyboard-operable buttons and gallery controls;
- accessible table captions and status labels;
- error/status announcements;
- meaningful image alternative text;
- reduced-motion support;
- sufficiently strong text/button contrast in the current theme;
- responsive layouts without removing core navigation on small screens; and
- skeleton loading states for listings and admin data.

This is an implementation pass, not a legal certification or formal WCAG audit. A final launch should still be tested with keyboard-only navigation, screen readers and an automated accessibility scanner such as axe or Lighthouse.

## Privacy, cookies and data minimisation

The application does not currently include advertising trackers or analytics scripts. It does not contain Google Analytics, Meta Pixel, Hotjar, Clarity or embedded third-party widgets.

The booking form collects only information required for the tour workflow plus an optional notes field. Payment proofs are stored in a private Supabase bucket and are not publicly readable.

The project includes:

- `/privacy`
- `/cookies`
- `/terms`
- `/refunds`
- `/contact`

The policies are written around the current workflow and Ghanaian data-protection context. They should be reviewed by qualified Ghanaian counsel and the operator should complete any Data Protection Commission registration/compliance obligations before commercial processing of personal data.

## Images and copyright

The demo inventory uses clearly labelled Unsplash imagery for interface demonstration. It must not be presented as real property inventory. Before launch, replace demo imagery with photographs/media that JDFortiHomes or the relevant property representative is authorised to publish.

Admins must confirm media rights before publishing a listing. The system does not claim ownership of third-party property media.

## Legal and consumer protection boundaries

JDFortiHomes does not promise that every property is available, owned by a particular person, suitable for a customer, or legally fit for a particular use. Customers are told to inspect and verify important property information before signing a tenancy agreement or making property-related payments.

A tour request is not a tenancy agreement and does not guarantee the property. The refund policy applies to the JDFortiHomes tour fee only and does not automatically govern rent, deposits or other money paid directly to property owners or representatives.

No software can guarantee that a business will never face a legal claim. These controls are intended to reduce avoidable risk; they do not replace legal advice, business registration, insurance, data-protection registration or operational due diligence.

## Before launch checklist

- Replace all demo listings and demo imagery.
- Configure real payment instructions.
- Set a real `SUPABASE_SERVICE_ROLE_KEY` only in the deployment environment.
- Confirm the Supabase project has the latest `supabase/schema.sql` applied.
- Create and test the admin account.
- Verify listing and payment-proof storage policies.
- Verify the booking API with valid and invalid inputs.
- Test the site with keyboard-only navigation and a screen reader.
- Run Lighthouse/axe and resolve any remaining issues.
- Review the Terms, Privacy, Cookies and Refund Policy with Ghanaian legal counsel.
- Complete any Data Protection Commission registration or other regulatory requirements that apply to the operator.
- Add a real support process for booking disputes and refunds.
- Deploy over HTTPS and keep the service-role key out of client-side code and source control.

## Advertisement system

The admin dashboard now includes an **Advertisements** section. Admins can create promotional ads with:

- placement: Home page below hero, Home page between sections, or Find a place above results
- start date and time
- duration in days, weeks, or months
- draft, active, or paused status
- optional destination URL
- optional JPG, PNG, or WebP artwork (maximum 5 MB)

Ads are not shown just because they are marked active. The public query also checks the current time against `starts_at` and `ends_at`. When an ad expires, it automatically disappears from the public website while remaining visible in the admin dashboard for record keeping. No scheduled job is required for this visibility rule.

Run the latest `supabase/schema.sql` in the Supabase SQL Editor after deploying this version. It creates the `ads` table and the `ad-media` storage bucket/policies.



## Advertisement system

The production ad system has two categories:

- **JDFortiHomes promotion** — platform marketing such as “Affordable homes without the guesswork”, “Discover premium homes at better prices”, or location-specific campaigns. These can link to an internal page or an external advertiser destination.
- **Sponsored property** — a property owner or representative can pay JDFortiHomes to promote an apartment, house, room, hostel or other accommodation. The admin first creates the property listing, confirms publishing rights, then creates a sponsored-property campaign linked to that listing.

Every campaign has a placement, start date/time, duration and status. When the end time passes, the ad is automatically excluded from public results. Sponsored properties also receive a `visibility_ends_at` value so the property itself stops appearing in the public directory when its campaign expires. Expired campaigns remain visible to administrators for records.

Recommended platform campaign copy:

- “Affordable homes without the guesswork.”
- “Looking for a premium home? Find better options with JDFortiHomes.”
- “Find a place near where you need to be.”
- “See it before you decide. Book a guided property tour.”

Do not describe a property as verified, available, affordable, luxury or discounted unless the relevant claim has been checked and can be supported.
