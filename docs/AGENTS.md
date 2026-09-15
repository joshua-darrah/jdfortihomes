# Agent System

Agents are normal Supabase Auth users with the application role `agent` and a matching row in `public.agents`.

## Account setup

1. Create the user in Supabase Authentication.
2. Create the agent record in Admin → Agents.
3. Link the Auth user's UUID to the agent record.
4. Confirm that the profile role is `agent`.
5. The agent signs in through `/agent`.

## Permissions

An agent can:

- view and manage their assigned property listings;
- view and manage their assigned advertisements;
- view bookings they are entitled to see;
- update permitted booking statuses through the restricted database function;
- view relevant private payment proofs; and
- view their own operational overview and payout information.

An agent cannot:

- manage other agents;
- manage administrator accounts;
- view every platform booking;
- manage another agent's listings or ads;
- manage platform-wide settings; or
- approve or edit another agent's payouts.

## Assignment model

Property-level assignment lives in `listing_agents`.

Advertisement-level assignment lives in `ad_agents`.

One-off booking transfers live in `booking_agents`.

This separation is intentional. It allows an administrator to move one booking to another agent without changing ownership of the property or all related bookings.

## Workload

The agent dashboard distinguishes directly assigned bookings from normal property assignments. The administrator Overview uses effective assignments when calculating workload.

## Security

RLS policies and restricted database functions are the security boundary. UI restrictions are only an additional usability layer.
