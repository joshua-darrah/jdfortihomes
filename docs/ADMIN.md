# Administrator Guide

Open `/admin` and sign in with a Supabase Auth account whose `profiles.role` is `admin`.

## Overview

The Overview tab is the operational dashboard. It refreshes every 15 seconds while the administrator is signed in.

It currently shows:

- active bookings;
- published properties;
- active promotions;
- agent coverage;
- seven-day booking activity;
- 30-day booking volume and daily average;
- booking status funnel;
- confirmation and cancellation rates;
- published inventory by city;
- published inventory by property type;
- effective agent workload;
- unassigned bookings;
- upcoming tours; and
- recent booking, listing and advertisement activity.

The dashboard does not use an external analytics service. These values are calculated from the application's own records.

## Bookings

Administrators can inspect booking details, payment proof, consent records and booking status.

### Direct agent assignment

Use `Assign agent` on a booking to select an active agent. The dialog shows the number of direct booking assignments currently held by each agent so work can be balanced.

A direct assignment affects only that booking. It does not move the property's other bookings.

Use the remove/unassign option to delete the direct assignment and return the booking to the property's normal property-level agent.

## Listings

Listings are edited in a modal. Clicking a listing opens the editor. New listings use the same editor. Delete operations require confirmation.

Demo listings are excluded from operational sponsored-property workflows.

## Advertisements

Advertisements support platform promotions and sponsored properties. Active advertisements automatically stop appearing when their end time passes. Expired campaigns remain in the admin dashboard for records.

Deleting a sponsored-property campaign restores the linked property's normal visibility.

## Agents

Agents can be created, edited and linked to Supabase Auth users. The Agents section also contains payout management.

Agent permissions are enforced by the database, so hiding a button in the UI is not the security boundary.

## Operational recommendations

- Check unassigned bookings regularly.
- Balance workload before peak tour periods.
- Review promotions that expire within a few days.
- Verify property/media rights before publishing.
- Keep payment instructions current.
- Do not put secrets into listing or advertisement fields.
