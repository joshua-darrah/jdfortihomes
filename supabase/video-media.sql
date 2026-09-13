-- JDFortiHomes video-media migration
-- Run this in Supabase SQL Editor if your existing project was created
-- before video thumbnails were added to the listings table.

alter table public.listings
  add column if not exists video_thumbnail_urls text[] not null default '{}';

-- The existing listing-media bucket already supports JPG/PNG/WebP and
-- MP4/WebM/MOV in the main schema. Generated video thumbnails are stored
-- beside the listing video under listings/<listing-id>/thumbnails/.
