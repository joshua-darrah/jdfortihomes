# Booking and tour-fee model

JDFortiHomes supports one or more property tours in a single booking submission.

- `bookings` stores the customer, payment proof, booking status and aggregate totals.
- `booking_items` stores one row per property tour, including the property, date/time and fee snapshots.
- `tour_fee_discounts` stores the configurable volume-discount tiers.
- Agent-set property fees are optional. If an agent does not set a fee, the platform default is used.
- JDFortiHomes commission is calculated only from agent-set fees and is stored as a historical snapshot on each booking item.
- A single payment proof can cover all tours in the booking.
- The server recalculates fees and discounts; the browser preview is not trusted for payment amounts.

Default discount tiers are:

| Tour count | Discount |
| --- | ---: |
| 1 | 0% |
| 2 | 33.33% |
| 3 | 46.67% |
| 4+ | 50% |

These are starting values and can be changed by an administrator.
