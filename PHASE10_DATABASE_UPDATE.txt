-- NOMAD PARK PAD PHASE 10
-- Run this once in Supabase SQL Editor.
-- It adds indexes for faster booking dashboards and messaging.

create index if not exists booking_requests_traveler_id_idx
on public.booking_requests (traveler_id, created_at desc);

create index if not exists booking_requests_listing_id_idx
on public.booking_requests (listing_id, created_at desc);

create index if not exists messages_booking_id_created_at_idx
on public.messages (booking_id, created_at asc);

-- Prevent duplicate pending requests for identical dates on the same listing.
create unique index if not exists booking_requests_no_duplicate_pending_idx
on public.booking_requests (listing_id, traveler_id, arrival, departure)
where status = 'pending';
