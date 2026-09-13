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
