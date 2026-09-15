# Analytics

The admin analytics are operational metrics derived from existing JDFortiHomes records. No external analytics or tracking service is required.

## Current metrics

### Booking activity

- 7-day daily booking count
- today count
- 30-day booking volume
- average daily bookings over the last 30 days

Deleted bookings are excluded from operational metrics.

### Booking funnel

The dashboard counts bookings by:

- payment pending;
- payment submitted;
- confirmed;
- tour completed; and
- cancelled.

The confirmation rate is calculated as `(confirmed + completed) / active bookings`.

This is an operational ratio, not a financial or marketing conversion metric.

### Agent coverage

A booking is considered assigned when it has either a direct `booking_agents` assignment or a property-level `listing_agents` assignment.

Agent coverage is `assigned active bookings / active bookings`.

### Property inventory

Published, non-demo listings are grouped by:

- city;
- property type.

Only the leading groups are shown in the compact dashboard.

### Advertisement operations

The dashboard counts currently active campaigns and flags campaigns ending within three days.

### Workload

Agent workload uses effective assignment. Direct booking assignments override property-level assignments for that booking.

## Why there is no analytics table

Creating a second table containing totals would duplicate facts already present in bookings, listings, ads and assignments. It would also create synchronization problems.

For the current product size, deriving these values from existing records is simpler and safer. If the platform becomes large enough that loading operational records for analytics is expensive, move the calculations into admin-only SQL views/functions rather than adding duplicated counters to business tables.

## Future metrics that require new source data

The current schema does not claim to measure:

- page views;
- unique visitors;
- search impressions;
- click-through rates;
- listing saves;
- marketing attribution; or
- revenue actually received by JDFortiHomes.

Those should only be added after the product has an explicit event/data model for them.
