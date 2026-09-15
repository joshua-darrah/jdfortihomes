# Architecture

## Goal

Keep JDFortiHomes easy to understand and inexpensive to operate while leaving clear boundaries for future growth.

## Application layers

### `app/`

Contains route-level UI and server endpoints.

- Public pages are rendered from the current Supabase data.
- `/api/bookings` is the trusted booking-entry point.
- `/admin` is the administrator interface.
- `/agent` is the restricted agent interface.
- `layout.tsx` owns global metadata, structured data, header, footer and consent UI.

### `components/`

Reusable UI such as the header, footer, listing cards, property gallery, booking form and loading states.

Components should remain focused. Business rules that can be shared should live in `lib/` instead of being duplicated across components.

### `lib/`

Shared application logic:

- `supabase.ts` — browser Supabase client
- `types.ts` — shared TypeScript data shapes
- `site-config.ts` — site and payment configuration
- `video.ts` — video URL and thumbnail helpers
- `ads.ts` — advertisement helpers
- `seo.ts` — canonical URL and SEO helpers
- `utils.ts` — small formatting/utilities

### `supabase/`

The relational database, security policies, triggers and focused migrations.

## Data flow

```text
Customer browser
      |
      v
Next.js public pages -----> Supabase public reads
      |
      v
/api/bookings ------------> Supabase service-role server client
                                |
                                +--> bookings
                                +--> private payment proof

Admin browser ------------> Supabase Auth + RLS
Agent browser ------------> Supabase Auth + RLS + restricted RPCs
```

## Simplicity rules

1. Prefer browser-native APIs and plain CSS before adding a dependency.
2. Keep data models relational and normalized.
3. Store facts once; calculate derived values such as analytics when needed.
4. Do not add tracking systems just to produce dashboard numbers.
5. Use database constraints and RLS for rules that must not be bypassed by the UI.
6. Avoid large abstractions for one-off UI behavior.
7. Keep functions small and give them one clear responsibility.
8. Comment the reason for non-obvious code, not every obvious line.
9. Use stable, descriptive names.
10. Test typechecking and production builds before deployment.

## Scalability direction

The current admin dashboard already reuses records loaded for normal administration, so the first analytics layer does not create a second data store. If traffic or dataset size grows substantially, the analytics calculations should move into dedicated admin-only SQL views/functions rather than adding duplicated counters to core tables.
