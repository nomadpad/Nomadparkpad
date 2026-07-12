-- NOMAD PARK PAD PHASE 9
-- Run this once in Supabase SQL Editor before testing the live marketplace.

create or replace view public.public_host_profiles
with (security_invoker = true)
as
select id, first_name, city
from public.profiles;

grant select on public.public_host_profiles to anon, authenticated;

-- Allow public visitors to read only the limited host identity fields used in listings.
drop policy if exists "public reads basic host profiles" on public.profiles;
create policy "public reads basic host profiles"
on public.profiles for select
to anon
using (
  exists (
    select 1 from public.listings l
    where l.host_id = profiles.id and l.status = 'published'
  )
);
