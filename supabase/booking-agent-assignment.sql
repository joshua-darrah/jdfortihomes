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
