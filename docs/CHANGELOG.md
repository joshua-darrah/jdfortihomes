# Changelog

## Admin analytics and cross-device reliability

- Expanded the administrator Overview with booking activity, booking funnel, confirmation/cancellation rates, 30-day volume, agent coverage, inventory distribution and promotion expiry indicators.
- Kept analytics derived from existing business records; no duplicate analytics table was introduced.
- Added targeted PostgreSQL indexes for common booking, listing and advertisement queries.
- Removed duplicated agent table/migration definitions from the canonical schema.
- Made the fresh-install `user_role` enum include `agent` from the start.
- Kept the separate existing-database agent migration with the required PostgreSQL enum-commit warning.
- Replaced the navbar/footer image source with a true standalone square JDFortiHomes mark instead of the full horizontal logo artwork.
- Added a dedicated 180×180 Apple touch icon.
- Added responsive viewport metadata, Apple web-app metadata, safe-area CSS and a web manifest.
- Added project documentation covering architecture, database, admin, agents, analytics, deployment and maintenance.

## Agent fees and booking commission

- Added optional agent-set tour fees per listing.
- Added admin-configurable default tour fee and JDFortiHomes commission percentage.
- Added immutable booking fee/commission/payout snapshots.
- Added automatic pending agent payout creation for agent-fee bookings.
- Direct booking reassignment now synchronizes pending/approved payout ownership.
- Payment details remain confined to the booking flow.
