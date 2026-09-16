# Database

JDFortiHomes uses PostgreSQL through Supabase. The design keeps core business facts in normalized tables and uses foreign keys, constraints, indexes and RLS for integrity and performance.

## Core entities

| Table | Purpose |
|---|---|
| `profiles` | Application role/profile linked to Supabase Auth |
| `listings` | Property inventory |
| `bookings` | Customer tour requests |
| `ads` | Platform and sponsored-property campaigns |
| `agents` | Internal agent records |
| `listing_agents` | Property-to-agent assignment |
| `ad_agents` | Advertisement-to-agent assignment |
| `booking_agents` | Direct booking-to-agent assignment |
| `agent_payouts` | Agent payout records |

The assignment tables are relationship tables. They prevent internal agent information from being embedded in public listing or advertisement data.

## Relationships

```text
profiles
  |
  +---- Supabase Auth user

listings 1 ---- 0..1 listing_agents N ---- 1 agents
ads      1 ---- 0..1 ad_agents     N ---- 1 agents
bookings 1 ---- 0..1 booking_agents N ---- 1 agents

bookings N ---- 1 listings
agent_payouts N ---- 1 agents
agent_payouts N ---- 0..1 listings
agent_payouts N ---- 0..1 ads
```

`listing_agents`, `ad_agents` and `booking_agents` use the business record ID as their primary key because the current product assigns at most one effective agent to each listing, advertisement or directly assigned booking.

## Booking assignment rule

A booking has two possible sources of agent assignment:

1. `booking_agents` — a direct assignment made by an administrator.
2. `listing_agents` — the property's normal agent assignment.

A direct booking assignment wins. If there is no direct assignment, the property's assignment remains effective. Removing a direct assignment therefore returns the booking to the property's normal agent.

## Normalization

The schema avoids storing repeated agent names, customer records or property records inside bookings. Foreign keys identify related entities. Many-to-one and assignment relationships are represented with keys rather than duplicated descriptive data.

Analytics are derived from existing records instead of stored as repeated counters. This avoids stale duplicated totals.

## Constraints

Important rules are enforced in the database where practical:

- primary keys identify rows;
- foreign keys protect relationships;
- status fields use constrained values;
- payout amounts cannot be negative;
- agent IDs are unique where an account link is present;
- RLS restricts administrative and agent-only records.

## Security

Public users can read only public inventory/advertisements. Agents can read only records assigned to them. Administrators receive the full management permissions required by the dashboard.

The payment-proof storage bucket is private. The booking API uses the service-role client on the server to upload proofs and create booking rows.

## Migration order

### Fresh database

Run:

```text
supabase/schema.sql
```

The fresh schema already contains the `agent` role and the direct booking assignment system.

### Existing database

Use the focused migrations when upgrading an older installation:

1. `supabase/agent-tracking.sql`
2. `supabase/agent-access.sql`
3. `supabase/video-media.sql`
4. `supabase/booking-agent-assignment.sql`
5. `supabase/performance-indexes.sql`

For `agent-access.sql`, run the `ALTER TYPE` statement separately first and allow it to commit before running the remainder of that migration. PostgreSQL does not permit a newly added enum value to be used in the same transaction that adds it.

Do not repeatedly recreate production data from the demo seed section of the schema.

## Performance indexes

The targeted indexes cover common filters and ordering for:

- booking creation/status/date;
- published listing status/city/property type;
- advertisement status/end date; and
- advertisement-to-listing lookup.

Indexes are used selectively because every additional index adds write and storage overhead.

## Agent tour fees and platform commission

- `listings.agent_fee` is optional. When set by an agent, it becomes the tour fee for that property.
- `platform_settings.default_tour_fee` is the fallback tour fee for listings without an agent-set fee.
- `platform_settings.agent_commission_rate` is the JDFortiHomes percentage applied to agent-set tour fees. The current seeded default is 15%, and the administrator can change it from the Agents section.
- Each booking stores a snapshot of `agent_fee`, `platform_commission_rate`, `platform_commission_amount`, and `agent_payout_amount` so later rate changes do not rewrite historical bookings.
- Agent-set bookings automatically create a pending `agent_payouts` record for the effective agent. Direct booking assignment can move that pending/approved payout to the newly assigned agent.
- The public `get_public_tour_fee` RPC exposes only the effective fee for a currently published listing. Payment account details remain environment configuration and are rendered only inside the booking flow.
