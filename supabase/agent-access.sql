-- JDFortiHomes: restricted agent accounts and agent dashboard access.
-- IMPORTANT: run the enum statement below by itself and let it commit before
-- running the rest of this migration. PostgreSQL does not allow a newly added
-- enum value to be used in the same transaction that adds it.
-- Run after agent-tracking.sql.
-- Agents are normal Supabase Auth users with profiles.role = 'agent'.

alter type public.user_role add value if not exists 'agent';

alter table public.agents
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists agents_user_id_unique_idx
  on public.agents(user_id)
  where user_id is not null;

create or replace function public.is_agent()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'agent'
  );
$$;

create or replace function public.current_agent_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.agents
  where user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

create or replace function public.link_agent_account(
  agent_record_id uuid,
  auth_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if auth_user_id is not null then
    select role into existing_role
    from public.profiles
    where id = auth_user_id;

    if not found then
      raise exception 'The Supabase Auth user does not have a profile';
    end if;

    if existing_role = 'admin' then
      raise exception 'An administrator account cannot be linked as an agent';
    end if;
  end if;

  update public.agents
  set user_id = auth_user_id
  where id = agent_record_id;

  if not found then
    raise exception 'Agent record not found';
  end if;

  if auth_user_id is not null then
    update public.profiles
    set role = 'agent'
    where id = auth_user_id;
  end if;

  return true;
end;
$$;

revoke all on function public.link_agent_account(uuid, uuid) from public;
grant execute on function public.link_agent_account(uuid, uuid) to authenticated;

revoke all on function public.is_agent() from public;
revoke all on function public.current_agent_id() from public;
grant execute on function public.is_agent() to authenticated;
grant execute on function public.current_agent_id() to authenticated;

-- Agents can see only their own agent record.
drop policy if exists "Agents can read own agent record" on public.agents;
create policy "Agents can read own agent record"
on public.agents for select
to authenticated
using (user_id = auth.uid());

-- Agents can see only their own listing assignments.
drop policy if exists "Agents can read own listing assignments" on public.listing_agents;
create policy "Agents can read own listing assignments"
on public.listing_agents for select
to authenticated
using (agent_id = public.current_agent_id());

-- Agents can see only their own ad assignments.
drop policy if exists "Agents can read own ad assignments" on public.ad_agents;
create policy "Agents can read own ad assignments"
on public.ad_agents for select
to authenticated
using (agent_id = public.current_agent_id());

-- Automatically attribute new listings and advertisements created by an agent.
create or replace function public.assign_new_listing_to_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_agent() then
    insert into public.listing_agents (listing_id, agent_id)
    values (new.id, public.current_agent_id())
    on conflict (listing_id) do update set agent_id = excluded.agent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_new_listing_to_agent on public.listings;
create trigger assign_new_listing_to_agent
after insert on public.listings
for each row execute procedure public.assign_new_listing_to_agent();

create or replace function public.assign_new_ad_to_agent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_agent() then
    insert into public.ad_agents (ad_id, agent_id)
    values (new.id, public.current_agent_id())
    on conflict (ad_id) do update set agent_id = excluded.agent_id;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_new_ad_to_agent on public.ads;
create trigger assign_new_ad_to_agent
after insert on public.ads
for each row execute procedure public.assign_new_ad_to_agent();


-- Do not let an authenticated agent's dashboard query use the public inventory policies.
-- The public site itself uses the anonymous role.
drop policy if exists "Public can read published listings" on public.listings;
create policy "Public can read published listings"
on public.listings for select
to anon
using (status = 'published' and (visibility_starts_at is null or visibility_starts_at <= now()) and (visibility_ends_at is null or visibility_ends_at > now()));

drop policy if exists "Customers can read published listings" on public.listings;
create policy "Customers can read published listings"
on public.listings for select
to authenticated
using (
  not public.is_agent()
  and not public.is_admin()
  and status = 'published'
  and (visibility_starts_at is null or visibility_starts_at <= now())
  and (visibility_ends_at is null or visibility_ends_at > now())
);

-- Replace broad admin-only listing policy with separate admin and agent policies.
drop policy if exists "Admins can manage listings" on public.listings;
create policy "Admins can manage listings"
on public.listings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Agents can read assigned listings" on public.listings;
create policy "Agents can read assigned listings"
on public.listings for select
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id = listings.id
      and la.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Agents can create listings" on public.listings;
create policy "Agents can create listings"
on public.listings for insert
to authenticated
with check (public.is_agent());

drop policy if exists "Agents can update assigned listings" on public.listings;
create policy "Agents can update assigned listings"
on public.listings for update
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id = listings.id
      and la.agent_id = public.current_agent_id()
  )
)
with check (public.is_agent());

drop policy if exists "Agents can delete assigned listings" on public.listings;
create policy "Agents can delete assigned listings"
on public.listings for delete
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id = listings.id
      and la.agent_id = public.current_agent_id()
  )
);


-- Keep public advertisement reads separate from the restricted agent dashboard.
drop policy if exists "Public can read currently running ads" on public.ads;
create policy "Public can read currently running ads"
on public.ads for select
to anon
using (status = 'active' and starts_at <= now() and ends_at >= now());

drop policy if exists "Customers can read currently running ads" on public.ads;
create policy "Customers can read currently running ads"
on public.ads for select
to authenticated
using (
  not public.is_agent()
  and not public.is_admin()
  and status = 'active'
  and starts_at <= now()
  and ends_at >= now()
);

-- Advertisement access is limited to an agent's own campaigns.
drop policy if exists "Admins can manage ads" on public.ads;
create policy "Admins can manage ads"
on public.ads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Agents can read assigned ads" on public.ads;
create policy "Agents can read assigned ads"
on public.ads for select
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id = ads.id
      and aa.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Agents can create ads" on public.ads;
create policy "Agents can create ads"
on public.ads for insert
to authenticated
with check (public.is_agent());

drop policy if exists "Agents can update assigned ads" on public.ads;
create policy "Agents can update assigned ads"
on public.ads for update
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id = ads.id
      and aa.agent_id = public.current_agent_id()
  )
)
with check (public.is_agent());

drop policy if exists "Agents can delete assigned ads" on public.ads;
create policy "Agents can delete assigned ads"
on public.ads for delete
to authenticated
using (
  public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id = ads.id
      and aa.agent_id = public.current_agent_id()
  )
);

-- Agents may view bookings belonging to properties assigned to them.
drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings"
on public.bookings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Agents can read assigned bookings" on public.bookings;
create policy "Agents can read assigned bookings"
on public.bookings for select
to authenticated
using (
  public.is_agent()
  and exists (
    select 1
    from public.listing_agents la
    where la.listing_id = bookings.listing_id
      and la.agent_id = public.current_agent_id()
  )
);

-- Agents can change only the booking status, not customer/payment/consent data.
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
    join public.listing_agents la on la.listing_id = b.listing_id
    where b.id = booking_id
      and la.agent_id = public.current_agent_id()
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

-- Agents can read payment proofs for bookings tied to their assigned properties.
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
    join public.listing_agents la on la.listing_id = b.listing_id
    where b.payment_proof_path = name
      and la.agent_id = public.current_agent_id()
  )
);

-- Agents may upload/update/delete media only for their assigned listings.
drop policy if exists "Admins listing media insert" on storage.objects;
create policy "Admins listing media insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-media' and public.is_admin());

drop policy if exists "Agents listing media insert" on storage.objects;
create policy "Agents listing media insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-media'
  and public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id::text = split_part(name, '/', 2)
      and la.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Admins listing media update" on storage.objects;
create policy "Admins listing media update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-media' and public.is_admin())
with check (bucket_id = 'listing-media' and public.is_admin());

drop policy if exists "Agents listing media update" on storage.objects;
create policy "Agents listing media update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-media'
  and public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id::text = split_part(name, '/', 2)
      and la.agent_id = public.current_agent_id()
  )
)
with check (
  bucket_id = 'listing-media'
  and public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id::text = split_part(name, '/', 2)
      and la.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Admins listing media delete" on storage.objects;
create policy "Admins listing media delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-media' and public.is_admin());

drop policy if exists "Agents listing media delete" on storage.objects;
create policy "Agents listing media delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-media'
  and public.is_agent()
  and exists (
    select 1 from public.listing_agents la
    where la.listing_id::text = split_part(name, '/', 2)
      and la.agent_id = public.current_agent_id()
  )
);

-- Advertisement media is similarly restricted.
drop policy if exists "Admins ad media insert" on storage.objects;
create policy "Admins ad media insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'ad-media' and public.is_admin());

drop policy if exists "Agents ad media insert" on storage.objects;
create policy "Agents ad media insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'ad-media'
  and public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id::text = split_part(name, '/', 2)
      and aa.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Admins ad media update" on storage.objects;
create policy "Admins ad media update"
on storage.objects for update
to authenticated
using (bucket_id = 'ad-media' and public.is_admin())
with check (bucket_id = 'ad-media' and public.is_admin());

drop policy if exists "Agents ad media update" on storage.objects;
create policy "Agents ad media update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'ad-media'
  and public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id::text = split_part(name, '/', 2)
      and aa.agent_id = public.current_agent_id()
  )
)
with check (
  bucket_id = 'ad-media'
  and public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id::text = split_part(name, '/', 2)
      and aa.agent_id = public.current_agent_id()
  )
);

drop policy if exists "Admins ad media delete" on storage.objects;
create policy "Admins ad media delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'ad-media' and public.is_admin());

drop policy if exists "Agents ad media delete" on storage.objects;
create policy "Agents ad media delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'ad-media'
  and public.is_agent()
  and exists (
    select 1 from public.ad_agents aa
    where aa.ad_id::text = split_part(name, '/', 2)
      and aa.agent_id = public.current_agent_id()
  )
);
