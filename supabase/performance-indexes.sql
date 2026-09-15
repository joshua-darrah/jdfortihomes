-- JDFortiHomes: small, targeted indexes for common admin and public queries.
-- These indexes do not duplicate application data and do not change the data model.
-- Run after the main schema has been installed.

create index if not exists bookings_created_at_idx
  on public.bookings(created_at desc);

create index if not exists bookings_status_created_at_idx
  on public.bookings(status, created_at desc);

create index if not exists bookings_preferred_date_idx
  on public.bookings(preferred_date, preferred_time);

create index if not exists listings_status_created_at_idx
  on public.listings(status, created_at desc);

create index if not exists listings_city_status_idx
  on public.listings(city, status);

create index if not exists listings_property_type_status_idx
  on public.listings(property_type, status);

create index if not exists ads_status_ends_at_idx
  on public.ads(status, ends_at);

create index if not exists ads_listing_id_idx
  on public.ads(listing_id);
