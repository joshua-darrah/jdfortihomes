-- JDFortiHomes multi-tour booking + volume discount migration.
-- Run this after the existing JDFortiHomes schema/agent migrations.
-- New bookings can contain multiple property tours in one payment submission.

create table if not exists public.tour_fee_discounts (
  min_tours integer primary key check (min_tours >= 1),
  discount_rate numeric not null default 0 check (discount_rate >= 0 and discount_rate <= 100),
  updated_at timestamptz not null default now()
);

insert into public.tour_fee_discounts (min_tours, discount_rate)
values
  (1, 0),
  (2, 33.33),
  (3, 46.67),
  (4, 50)
on conflict (min_tours) do nothing;

create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  preferred_date date not null,
  preferred_time text not null,
  base_tour_fee numeric not null check (base_tour_fee >= 0),
  discount_rate numeric not null default 0 check (discount_rate >= 0 and discount_rate <= 100),
  tour_fee numeric not null check (tour_fee >= 0),
  agent_fee numeric check (agent_fee is null or agent_fee >= 0),
  platform_commission_rate numeric not null default 0 check (platform_commission_rate >= 0 and platform_commission_rate <= 100),
  platform_commission_amount numeric not null default 0 check (platform_commission_amount >= 0),
  agent_payout_amount numeric not null default 0 check (agent_payout_amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists booking_items_booking_id_idx on public.booking_items(booking_id);
create index if not exists booking_items_listing_id_idx on public.booking_items(listing_id);
create index if not exists booking_items_date_idx on public.booking_items(preferred_date, preferred_time);

alter table public.tour_fee_discounts enable row level security;
alter table public.booking_items enable row level security;

drop policy if exists "Admins can manage tour fee discounts" on public.tour_fee_discounts;
create policy "Admins can manage tour fee discounts"
on public.tour_fee_discounts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read tour fee discounts" on public.tour_fee_discounts;
create policy "Public can read tour fee discounts"
on public.tour_fee_discounts for select
to anon, authenticated
using (true);

create or replace function public.agent_can_access_booking(target_booking_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_agent()
    and exists (
      select 1
      from public.bookings b
      where b.id = target_booking_id
        and (
          exists (
            select 1
            from public.booking_agents ba
            where ba.booking_id = b.id
              and ba.agent_id = public.current_agent_id()
          )
          or (
            not exists (
              select 1
              from public.booking_agents ba
              where ba.booking_id = b.id
            )
            and (
              exists (
                select 1
                from public.listing_agents la
                where la.listing_id = b.listing_id
                  and la.agent_id = public.current_agent_id()
              )
              or exists (
                select 1
                from public.booking_items bi
                join public.listing_agents la on la.listing_id = bi.listing_id
                where bi.booking_id = b.id
                  and la.agent_id = public.current_agent_id()
              )
            )
          )
        )
    );
$$;

revoke all on function public.agent_can_access_booking(uuid) from public;
grant execute on function public.agent_can_access_booking(uuid) to authenticated;

drop policy if exists "Admins can manage booking items" on public.booking_items;
create policy "Admins can manage booking items"
on public.booking_items for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Agents can read assigned booking items" on public.booking_items;
create policy "Agents can read assigned booking items"
on public.booking_items for select
to authenticated
using (public.agent_can_access_booking(booking_id));


create or replace function public.get_public_tour_discount(tour_count integer)
returns numeric
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select discount_rate
      from public.tour_fee_discounts
      where min_tours <= greatest(tour_count, 1)
      order by min_tours desc
      limit 1
    ),
    0
  );
$$;

revoke all on function public.get_public_tour_discount(integer) from public;
grant execute on function public.get_public_tour_discount(integer) to anon, authenticated;

create or replace function public.get_public_tour_fees(listing_record_ids uuid[])
returns table (listing_id uuid, tour_fee numeric)
language sql
security definer
set search_path = public
as $$
  select
    l.id,
    coalesce(l.agent_fee, ps.default_tour_fee)
  from public.listings l
  cross join public.platform_settings ps
  where l.id = any(listing_record_ids)
    and l.status = 'published'
    and (l.visibility_starts_at is null or l.visibility_starts_at <= now())
    and (l.visibility_ends_at is null or l.visibility_ends_at > now())
    and ps.id = 1;
$$;

revoke all on function public.get_public_tour_fees(uuid[]) from public;
grant execute on function public.get_public_tour_fees(uuid[]) to anon, authenticated;

-- New bookings create one payout per tour item rather than one payout per whole booking.
-- This keeps multi-property bookings correct when different properties have different agents.
drop trigger if exists create_agent_payout_for_booking on public.bookings;
drop function if exists public.create_agent_payout_for_booking();

drop index if exists public.agent_payouts_booking_id_unique_idx;
alter table public.agent_payouts drop constraint if exists agent_payouts_booking_id_key;
alter table public.agent_payouts
  add column if not exists booking_item_id uuid references public.booking_items(id) on delete set null;
create unique index if not exists agent_payouts_booking_item_unique_idx
  on public.agent_payouts(booking_item_id)
  where booking_item_id is not null;

create or replace function public.create_agent_payout_for_booking_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_agent uuid;
begin
  if new.agent_fee is null or new.agent_payout_amount <= 0 then
    return new;
  end if;

  select coalesce(
    (select ba.agent_id from public.booking_agents ba where ba.booking_id = new.booking_id limit 1),
    (select la.agent_id from public.listing_agents la where la.listing_id = new.listing_id limit 1)
  ) into assigned_agent;

  if assigned_agent is null then
    return new;
  end if;

  insert into public.agent_payouts (
    booking_id,
    booking_item_id,
    agent_id,
    listing_id,
    amount,
    currency,
    status,
    notes
  )
  select
    new.booking_id,
    new.id,
    assigned_agent,
    new.listing_id,
    new.agent_payout_amount,
    'GHS',
    'pending',
    'Automatically created from booking item for ' || b.reference || '. JDFortiHomes commission: ' || to_char(new.platform_commission_rate, 'FM999990.00') || '%. '
  from public.bookings b
  where b.id = new.booking_id
  on conflict (booking_item_id) do update
    set amount = excluded.amount,
        notes = excluded.notes,
        updated_at = now()
    where public.agent_payouts.status in ('pending', 'approved');

  return new;
end;
$$;

drop trigger if exists create_agent_payout_for_booking_item on public.booking_items;
create trigger create_agent_payout_for_booking_item
after insert or update on public.booking_items
for each row execute procedure public.create_agent_payout_for_booking_item();

-- Direct booking assignment still overrides the default property agent for all items in that booking.
create or replace function public.sync_payout_agent_from_booking_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_record public.bookings%rowtype;
  target_agent uuid;
begin
  select * into booking_record
  from public.bookings
  where id = case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;

  if booking_record.id is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    -- Existing single-tour bookings can still fall back to their listing assignment.
    select la.agent_id into target_agent
    from public.listing_agents la
    where la.listing_id = booking_record.listing_id
    limit 1;

    update public.agent_payouts
    set agent_id = target_agent, updated_at = now()
    where booking_id = booking_record.id
      and status in ('pending', 'approved')
      and target_agent is not null;
  else
    target_agent := new.agent_id;
    update public.agent_payouts
    set agent_id = target_agent, updated_at = now()
    where booking_id = booking_record.id
      and status in ('pending', 'approved');
  end if;

  return coalesce(new, old);
end;
$$;

-- Refresh the final agent booking policies so agents can see multi-tour bookings.
drop policy if exists "Agents can read assigned bookings" on public.bookings;
create policy "Agents can read assigned bookings"
on public.bookings for select
to authenticated
using (public.agent_can_access_booking(id));

-- Payment proofs follow the same effective booking access rule.
drop policy if exists "Agents read assigned payment proofs" on storage.objects;
create policy "Agents read assigned payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.is_agent()
  and exists (
    select 1
    from public.bookings b
    where b.payment_proof_path = name
      and public.agent_can_access_booking(b.id)
  )
);

create or replace function public.agent_update_booking_status(
  booking_id uuid,
  new_status public.booking_status
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_agent() then
    raise exception 'Agent access required';
  end if;

  if not exists (
    select 1
    from public.bookings b
    where b.id = booking_id
      and (
        exists (
          select 1
          from public.booking_agents ba
          where ba.booking_id = b.id
            and ba.agent_id = public.current_agent_id()
        )
        or (
          not exists (
            select 1
            from public.booking_agents ba
            where ba.booking_id = b.id
          )
          and (
            exists (
              select 1
              from public.listing_agents la
              where la.listing_id = b.listing_id
                and la.agent_id = public.current_agent_id()
            )
            or exists (
              select 1
              from public.booking_items bi
              join public.listing_agents la on la.listing_id = bi.listing_id
              where bi.booking_id = b.id
                and la.agent_id = public.current_agent_id()
            )
          )
        )
      )
  ) then
    raise exception 'Booking is not assigned to this agent';
  end if;

  update public.bookings
  set status = new_status
  where id = booking_id;

  return true;
end;
$$;

revoke all on function public.agent_update_booking_status(uuid, public.booking_status) from public;
grant execute on function public.agent_update_booking_status(uuid, public.booking_status) to authenticated;
