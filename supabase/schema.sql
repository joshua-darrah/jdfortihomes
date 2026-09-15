-- JDFortiHomes database and security schema.
-- Run this in the Supabase SQL Editor.
-- The application uses the server-only SUPABASE_SERVICE_ROLE_KEY for public booking creation
-- and payment-proof uploads. Never expose that key in a NEXT_PUBLIC_* variable.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.listing_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_status as enum ('pending_payment', 'payment_submitted', 'confirmed', 'tour_completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  property_type text not null,
  location text not null,
  city text not null,
  region text not null,
  address text,
  latitude numeric,
  longitude numeric,
  monthly_rent numeric not null default 0,
  bedrooms integer not null default 1,
  bathrooms integer not null default 1,
  furnishing text not null default 'Unfurnished',
  room_type text not null default 'Standard room',
  occupants integer not null default 1,
  lease_term text not null default '12 months',
  amenities text[] not null default '{}',
  image_urls text[] not null default '{}',
  video_urls text[] not null default '{}',
  video_thumbnail_urls text[] not null default '{}',
  contact_name text,
  contact_phone text,
  media_rights_confirmed boolean not null default false,
  media_rights_note text,
  status public.listing_status not null default 'draft',
  is_demo boolean not null default false,
  is_sponsored boolean not null default false,
  visibility_starts_at timestamptz,
  visibility_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  listing_id uuid not null references public.listings(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  preferred_date date not null,
  preferred_time text not null,
  notes text,
  tour_fee numeric not null default 50,
  payment_method text not null,
  payment_proof_path text,
  terms_accepted boolean not null default false,
  privacy_accepted boolean not null default false,
  consent_at timestamptz,
  status public.booking_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

alter table public.listings add column if not exists room_type text not null default 'Standard room';
alter table public.listings add column if not exists occupants integer not null default 1;
alter table public.listings add column if not exists lease_term text not null default '12 months';
alter table public.listings add column if not exists video_urls text[] not null default '{}';
alter table public.listings add column if not exists video_thumbnail_urls text[] not null default '{}';
alter table public.listings add column if not exists media_rights_confirmed boolean not null default false;
alter table public.listings add column if not exists media_rights_note text;
alter table public.listings add column if not exists is_sponsored boolean not null default false;
alter table public.listings add column if not exists visibility_starts_at timestamptz;
alter table public.listings add column if not exists visibility_ends_at timestamptz;
alter table public.bookings add column if not exists terms_accepted boolean not null default false;
alter table public.bookings add column if not exists privacy_accepted boolean not null default false;
alter table public.bookings add column if not exists consent_at timestamptz;
alter table public.bookings add column if not exists deleted_at timestamptz;
alter table public.bookings add column if not exists deleted_by uuid references auth.users(id);

create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_city_idx on public.listings(city);
create index if not exists listings_location_idx on public.listings(location);
create index if not exists listings_visibility_starts_at_idx on public.listings(visibility_starts_at);
create index if not exists listings_visibility_ends_at_idx on public.listings(visibility_ends_at);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
create index if not exists bookings_deleted_at_idx on public.bookings(deleted_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
before update on public.listings
for each row execute procedure public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Public listings only expose published inventory that has not reached an optional visibility end date.
drop policy if exists "Public can read published listings" on public.listings;
create policy "Public can read published listings"
on public.listings for select
using (status = 'published' and (visibility_starts_at is null or visibility_starts_at <= now()) and (visibility_ends_at is null or visibility_ends_at > now()));

drop policy if exists "Admins can manage listings" on public.listings;
create policy "Admins can manage listings"
on public.listings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

-- Booking creation and payment-proof upload are handled by the server route using
-- the service-role key. There is intentionally no public INSERT policy on bookings.
drop policy if exists "Anyone can create booking" on public.bookings;
drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings"
on public.bookings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Advertisements
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  ad_type text not null default 'platform_promotion' check (ad_type in ('platform_promotion', 'sponsored_property')),
  listing_id uuid references public.listings(id) on delete set null,
  advertiser_name text,
  advertiser_contact text,
  internal_notes text,
  title text not null,
  description text,
  image_url text,
  destination_url text,
  placement text not null default 'home_top' check (placement in ('home_top', 'home_mid', 'directory_top')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ads_valid_period check (ends_at > starts_at)
);

alter table public.ads add column if not exists ad_type text not null default 'platform_promotion';
alter table public.ads add column if not exists listing_id uuid references public.listings(id) on delete set null;
alter table public.ads add column if not exists advertiser_name text;
alter table public.ads add column if not exists advertiser_contact text;
alter table public.ads add column if not exists internal_notes text;
alter table public.ads enable row level security;
create index if not exists ads_public_lookup_idx on public.ads(placement, status, starts_at, ends_at);
create index if not exists ads_listing_id_idx on public.ads(listing_id);

drop trigger if exists ads_updated_at on public.ads;
create trigger ads_updated_at
before update on public.ads
for each row execute procedure public.set_updated_at();

drop policy if exists "Public can read currently running ads" on public.ads;
create policy "Public can read currently running ads"
on public.ads for select
using (
  status = 'active'
  and starts_at <= now()
  and ends_at >= now()
);

drop policy if exists "Admins can manage ads" on public.ads;
create policy "Admins can manage ads"
on public.ads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage
insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('ad-media', 'ad-media', true)
on conflict (id) do update set public = true;

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'ad-media';

drop policy if exists "Public ad media read" on storage.objects;
create policy "Public ad media read"
on storage.objects for select
using (bucket_id = 'ad-media');

drop policy if exists "Admins ad media insert" on storage.objects;
create policy "Admins ad media insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'ad-media' and public.is_admin());

drop policy if exists "Admins ad media update" on storage.objects;
create policy "Admins ad media update"
on storage.objects for update
to authenticated
using (bucket_id = 'ad-media' and public.is_admin())
with check (bucket_id = 'ad-media' and public.is_admin());

drop policy if exists "Admins ad media delete" on storage.objects;
create policy "Admins ad media delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'ad-media' and public.is_admin());

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

update storage.buckets
set file_size_limit = 50 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'listing-media';

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'payment-proofs';

drop policy if exists "Public listing media read" on storage.objects;
create policy "Public listing media read"
on storage.objects for select
using (bucket_id = 'listing-media');

drop policy if exists "Admins listing media insert" on storage.objects;
create policy "Admins listing media insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-media' and public.is_admin());

drop policy if exists "Admins listing media update" on storage.objects;
create policy "Admins listing media update"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-media' and public.is_admin())
with check (bucket_id = 'listing-media' and public.is_admin());

drop policy if exists "Admins listing media delete" on storage.objects;
create policy "Admins listing media delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-media' and public.is_admin());

-- Payment proofs are never public and cannot be uploaded directly by anonymous users.
-- The Next.js server route uses the service-role key after validating the booking request.
drop policy if exists "Customers upload payment proofs" on storage.objects;
drop policy if exists "Admins read payment proofs" on storage.objects;
create policy "Admins read payment proofs"
on storage.objects for select
to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

-- Realtime
-- Optional: allow admin clients to receive ad changes in realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;
end $$;

 do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table public.listings;
  end if;
end $$;

-- Optional: keep booking changes available to the admin client for live status updates.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- Clearly labelled demo inventory. Replace these records before launch.
insert into public.listings
(title, description, property_type, location, city, region, address, monthly_rent, bedrooms, bathrooms, furnishing, amenities, image_urls, contact_name, contact_phone, media_rights_confirmed, media_rights_note, status, is_demo)
values
(
  'Demo: Modern 2-Bedroom Apartment',
  'Demonstration inventory only. This record is not a verified property and must be replaced before public launch.',
  'Apartment', 'Ayeduase', 'Kumasi', 'Ashanti', 'Ayeduase, Kumasi',
  4200, 2, 2, 'Semi-furnished', array['Water supply', 'Parking', 'Kitchen', 'Security'],
  array['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85'],
  'Demo Property Desk', null, true, 'Demo imagery loaded from Unsplash. Replace with media you are authorised to publish.', 'published', true
),
(
  'Demo: Private Studio Near KNUST',
  'Demonstration inventory only. This record is not a verified property and must be replaced before public launch.',
  'Studio', 'Kotei', 'Kumasi', 'Ashanti', 'Kotei, Kumasi',
  2400, 1, 1, 'Furnished', array['Wi-Fi ready', 'Kitchenette', 'Security', 'Water supply'],
  array['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85'],
  'Demo Property Desk', null, true, 'Demo imagery loaded from Unsplash. Replace with media you are authorised to publish.', 'published', true
),
(
  'Demo: Family House at Ahodwo',
  'Demonstration inventory only. This record is not a verified property and must be replaced before public launch.',
  'House', 'Ahodwo', 'Kumasi', 'Ashanti', 'Ahodwo, Kumasi',
  6500, 3, 3, 'Unfurnished', array['Compound', 'Parking', 'Kitchen', 'Security'],
  array['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85'],
  'Demo Property Desk', null, true, 'Demo imagery loaded from Unsplash. Replace with media you are authorised to publish.', 'published', true
)
on conflict do nothing;

-- Internal agent tracking. These tables are intentionally separate from public listings/ads
-- so agent identities and payout records are never exposed by public SELECT policies.
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null unique,
  full_name text not null,
  phone text,
  email text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_agents (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_agents (
  ad_id uuid primary key references public.ads(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete restrict,
  listing_id uuid references public.listings(id) on delete set null,
  ad_id uuid references public.ads(id) on delete set null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  reference text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_agents_agent_id_idx on public.listing_agents(agent_id);
create index if not exists ad_agents_agent_id_idx on public.ad_agents(agent_id);
create index if not exists agent_payouts_agent_id_idx on public.agent_payouts(agent_id);
create index if not exists agent_payouts_status_idx on public.agent_payouts(status);

alter table public.agents enable row level security;
alter table public.listing_agents enable row level security;
alter table public.ad_agents enable row level security;
alter table public.agent_payouts enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_updated_at on public.agents;
create trigger agents_updated_at before update on public.agents for each row execute procedure public.set_updated_at();
drop trigger if exists listing_agents_updated_at on public.listing_agents;
create trigger listing_agents_updated_at before update on public.listing_agents for each row execute procedure public.set_updated_at();
drop trigger if exists ad_agents_updated_at on public.ad_agents;
create trigger ad_agents_updated_at before update on public.ad_agents for each row execute procedure public.set_updated_at();
drop trigger if exists agent_payouts_updated_at on public.agent_payouts;
create trigger agent_payouts_updated_at before update on public.agent_payouts for each row execute procedure public.set_updated_at();

drop policy if exists "Admins can manage agents" on public.agents;
create policy "Admins can manage agents" on public.agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage listing agents" on public.listing_agents;
create policy "Admins can manage listing agents" on public.listing_agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage ad agents" on public.ad_agents;
create policy "Admins can manage ad agents" on public.ad_agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage agent payouts" on public.agent_payouts;
create policy "Admins can manage agent payouts" on public.agent_payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- JDFortiHomes: private agent tracking and payouts migration.
-- Run this if the base schema is already installed and you do not want to rerun schema.sql.
-- Requires the existing public.is_admin() function and public.listings/public.ads tables.

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null unique,
  full_name text not null,
  phone text,
  email text,
  notes text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_agents (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_agents (
  ad_id uuid primary key references public.ads(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_payouts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete restrict,
  listing_id uuid references public.listings(id) on delete set null,
  ad_id uuid references public.ads(id) on delete set null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  reference text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_agents_agent_id_idx on public.listing_agents(agent_id);
create index if not exists ad_agents_agent_id_idx on public.ad_agents(agent_id);
create index if not exists agent_payouts_agent_id_idx on public.agent_payouts(agent_id);
create index if not exists agent_payouts_status_idx on public.agent_payouts(status);

alter table public.agents enable row level security;
alter table public.listing_agents enable row level security;
alter table public.ad_agents enable row level security;
alter table public.agent_payouts enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_updated_at on public.agents;
create trigger agents_updated_at before update on public.agents for each row execute procedure public.set_updated_at();
drop trigger if exists listing_agents_updated_at on public.listing_agents;
create trigger listing_agents_updated_at before update on public.listing_agents for each row execute procedure public.set_updated_at();
drop trigger if exists ad_agents_updated_at on public.ad_agents;
create trigger ad_agents_updated_at before update on public.ad_agents for each row execute procedure public.set_updated_at();
drop trigger if exists agent_payouts_updated_at on public.agent_payouts;
create trigger agent_payouts_updated_at before update on public.agent_payouts for each row execute procedure public.set_updated_at();

drop policy if exists "Admins can manage agents" on public.agents;
create policy "Admins can manage agents" on public.agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage listing agents" on public.listing_agents;
create policy "Admins can manage listing agents" on public.listing_agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage ad agents" on public.ad_agents;
create policy "Admins can manage ad agents" on public.ad_agents for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins can manage agent payouts" on public.agent_payouts;
create policy "Admins can manage agent payouts" on public.agent_payouts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- JDFortiHomes: restricted agent accounts and agent dashboard access.
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


-- Direct booking assignment migration
-- JDFortiHomes: direct booking assignment for agents.
-- A direct assignment overrides the property's default agent for that booking.

create table if not exists public.booking_agents (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null
);

create index if not exists booking_agents_agent_id_idx
  on public.booking_agents(agent_id);

create index if not exists booking_agents_assigned_at_idx
  on public.booking_agents(assigned_at desc);

alter table public.booking_agents enable row level security;

drop policy if exists "Admins can manage booking agents" on public.booking_agents;
create policy "Admins can manage booking agents"
on public.booking_agents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Agents can read own booking assignments" on public.booking_agents;
create policy "Agents can read own booking assignments"
on public.booking_agents for select
to authenticated
using (
  public.is_agent()
  and agent_id = public.current_agent_id()
);

-- Direct booking assignment overrides the property's default agent.
-- If no direct assignment exists, the property assignment continues to grant access.
drop policy if exists "Agents can read assigned bookings" on public.bookings;
create policy "Agents can read assigned bookings"
on public.bookings for select
to authenticated
using (
  public.is_agent()
  and (
    exists (
      select 1
      from public.booking_agents ba
      where ba.booking_id = bookings.id
        and ba.agent_id = public.current_agent_id()
    )
    or (
      not exists (
        select 1
        from public.booking_agents ba
        where ba.booking_id = bookings.id
      )
      and exists (
        select 1
        from public.listing_agents la
        where la.listing_id = bookings.listing_id
          and la.agent_id = public.current_agent_id()
      )
    )
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
          and exists (
            select 1
            from public.listing_agents la
            where la.listing_id = b.listing_id
              and la.agent_id = public.current_agent_id()
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
