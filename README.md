# JDFortiHomes

JDFortiHomes is a Ghana-focused accommodation discovery and property-tour booking platform. The project is built to stay simple, maintainable and ready to grow without introducing unnecessary dependencies.

## Stack

- Next.js 15
- React 19
- TypeScript
- Plain CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Next.js server route for public booking creation

## Project structure

```text
app/                 Next.js pages, layouts and API routes
components/          Reusable UI components
lib/                 Shared types, Supabase client, site config and helpers
public/               Logo, favicon, social preview and verification assets
supabase/             Database schema and focused migrations
docs/                 Project documentation
```

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Create a Supabase project.
4. Run `supabase/schema.sql` in the Supabase SQL Editor for a fresh database.
5. Create `.env.local` from `.env.example`.
6. Add the required Supabase and payment variables.
7. Run `npm run dev`.
8. Create an Auth user and set its `profiles.role` to `admin` for administrator access.

For an existing database, use the focused migration files in `supabase/` in the order documented in [`docs/DATABASE.md`](docs/DATABASE.md).

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_TOUR_FEE_GHS=50
NEXT_PUBLIC_PAYMENT_MOMO_NETWORK=
NEXT_PUBLIC_PAYMENT_MOMO_NAME=
NEXT_PUBLIC_PAYMENT_MOMO_NUMBER=
NEXT_PUBLIC_PAYMENT_BANK_NAME=
NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME=
NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER=
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`, place it in client code, or commit it to Git.

## Main workflows

### Customer

1. Browse published properties.
2. Open a property.
3. Select a tour date and time.
4. Follow the configured manual payment instructions.
5. Upload payment proof.
6. Accept the Terms and Privacy Policy.
7. Submit the booking.
8. Receive a booking reference.

### Administrator

Administrators use `/admin` to manage bookings, listings, advertisements and agents. The Overview tab provides live operational analytics and refreshes in the background every 15 seconds.

### Agent

Agents use `/agent`. Access is enforced by Supabase RLS and database functions, not only by the UI. A direct booking assignment can override the normal property-level agent assignment for one booking.

## Security principles

- Public users cannot directly insert bookings into Supabase.
- Booking creation uses the server-only service-role key.
- Payment proofs are stored privately.
- Admin and agent permissions are enforced with RLS.
- Agent identity is kept in private assignment tables rather than public listing data.
- No analytics, advertising or tracking scripts are installed.
- No fake payment credentials are included.

## Mobile and Apple devices

The interface uses responsive CSS, touch-friendly controls, safe-area support and local PNG branding assets. The project includes a favicon, Apple touch icon, web manifest and application icon so the brand remains available across Safari, iOS home-screen installs and desktop browsers.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — application structure and design principles
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema, relationships, RLS and migration order
- [`docs/ADMIN.md`](docs/ADMIN.md) — administrator workflows and analytics
- [`docs/AGENTS.md`](docs/AGENTS.md) — agent roles, assignments and permissions
- [`docs/ANALYTICS.md`](docs/ANALYTICS.md) — dashboard metrics and how they are calculated
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel and Supabase deployment checklist
- [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) — safe development and upgrade rules
- [`SECURITY-ACCESSIBILITY-AUDIT.md`](SECURITY-ACCESSIBILITY-AUDIT.md) — security and accessibility notes

## Validation

Before deployment:

```bash
npm run typecheck
npm run build
```

Do not use `npm audit fix --force` blindly. Major framework upgrades must be tested as controlled migrations.
