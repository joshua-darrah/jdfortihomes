-- JDFortiHomes agent fee + platform commission migration
-- Run this on an existing Supabase project.
-- Default platform commission is 15%; change it in the admin dashboard after migration.

alter table public.listings
  add column if not exists agent_fee numeric check (agent_fee is null or agent_fee >= 0);

alter table public.bookings
  add column if not exists agent_fee numeric check (agent_fee is null or agent_fee >= 0);
alter table public.bookings
  add column if not exists platform_commission_rate numeric not null default 15 check (platform_commission_rate >= 0 and platform_commission_rate <= 100);
alter table public.bookings
  add column if not exists platform_commission_amount numeric not null default 0 check (platform_commission_amount >= 0);
alter table public.bookings
  add column if not exists agent_payout_amount numeric not null default 0 check (agent_payout_amount >= 0);

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  default_tour_fee numeric not null default 50 check (default_tour_fee >= 0),
  agent_commission_rate numeric not null default 15 check (agent_commission_rate >= 0 and agent_commission_rate <= 100),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id, default_tour_fee, agent_commission_rate)
values (1, 50, 15)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
drop policy if exists "Admins can manage platform settings" on public.platform_settings;
create policy "Admins can manage platform settings" on public.platform_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Authenticated users can read platform commission rate" on public.platform_settings;
create policy "Authenticated users can read platform commission rate" on public.platform_settings for select to authenticated using (true);

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at before update on public.platform_settings for each row execute procedure public.set_updated_at();

create or replace function public.get_public_tour_fee(listing_record_id uuid)
returns numeric
language sql
security definer
set search_path = public
as $$
  select coalesce(l.agent_fee, ps.default_tour_fee)
  from public.listings l
  cross join public.platform_settings ps
  where l.id = listing_record_id
    and l.status = 'published'
    and (l.visibility_starts_at is null or l.visibility_starts_at <= now())
    and (l.visibility_ends_at is null or l.visibility_ends_at > now())
    and ps.id = 1
  limit 1;
$$;
revoke all on function public.get_public_tour_fee(uuid) from public;
grant execute on function public.get_public_tour_fee(uuid) to anon, authenticated;

alter table public.agent_payouts
  add column if not exists booking_id uuid references public.bookings(id) on delete set null;
create unique index if not exists agent_payouts_booking_id_unique_idx on public.agent_payouts(booking_id) where booking_id is not null;

create or replace function public.create_agent_payout_for_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare assigned_agent uuid;
begin
  if new.agent_fee is null or new.agent_payout_amount <= 0 then return new; end if;
  select coalesce(
    (select ba.agent_id from public.booking_agents ba where ba.booking_id = new.id limit 1),
    (select la.agent_id from public.listing_agents la where la.listing_id = new.listing_id limit 1)
  ) into assigned_agent;
  if assigned_agent is null then return new; end if;
  insert into public.agent_payouts (booking_id, agent_id, listing_id, amount, currency, status, notes)
  values (new.id, assigned_agent, new.listing_id, new.agent_payout_amount, 'GHS', 'pending',
    'Automatically created from booking ' || new.reference || '. JDFortiHomes commission: ' || to_char(new.platform_commission_rate, 'FM999990.00') || '%. ')
  on conflict (booking_id) do update
    set agent_id = excluded.agent_id, amount = excluded.amount, listing_id = excluded.listing_id, notes = excluded.notes, updated_at = now()
    where public.agent_payouts.status in ('pending', 'approved');
  return new;
end;
$$;

drop trigger if exists create_agent_payout_for_booking on public.bookings;
create trigger create_agent_payout_for_booking after insert on public.bookings for each row execute procedure public.create_agent_payout_for_booking();

create or replace function public.sync_payout_agent_from_booking_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare booking_record public.bookings%rowtype; target_agent uuid;
begin
  select * into booking_record from public.bookings where id = case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
  if booking_record.id is null or booking_record.agent_fee is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    select la.agent_id into target_agent from public.listing_agents la where la.listing_id = booking_record.listing_id limit 1;
  else target_agent := new.agent_id; end if;
  if target_agent is not null then
    update public.agent_payouts set agent_id = target_agent, updated_at = now()
    where booking_id = booking_record.id and status in ('pending', 'approved');
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_payout_agent_from_booking_assignment on public.booking_agents;
create trigger sync_payout_agent_from_booking_assignment after insert or update or delete on public.booking_agents for each row execute procedure public.sync_payout_agent_from_booking_assignment();
