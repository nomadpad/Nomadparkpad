-- NOMAD PARK PAD PHASE 8 DATABASE
-- Run this entire file in Supabase SQL Editor.
-- It creates the first real backend tables and Row Level Security policies.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  city text,
  role text not null default 'traveler' check (role in ('traveler','host','both','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  city text not null,
  province text not null default 'Alberta',
  nightly_price numeric(10,2) not null check (nightly_price >= 0),
  host_style text not null default 'Quiet Overnight',
  max_guests integer not null default 1 check (max_guests > 0),
  max_vehicle_length text,
  amenities text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  arrival date not null,
  departure date not null,
  travelers integer not null default 1 check (travelers > 0),
  vehicle_type text,
  vehicle_length text,
  pets text,
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','paid','completed')),
  total_amount numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (departure > arrival)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_pads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, city, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    case
      when new.raw_user_meta_data->>'role' in ('traveler','host','both')
      then new.raw_user_meta_data->>'role'
      else 'traveler'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.booking_requests enable row level security;
alter table public.messages enable row level security;
alter table public.saved_pads enable row level security;
alter table public.reviews enable row level security;

-- Profiles
create policy "profiles readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Listings
create policy "published listings are public"
on public.listings for select
to anon, authenticated
using (status = 'published' or auth.uid() = host_id);

create policy "hosts create own listings"
on public.listings for insert
to authenticated
with check (auth.uid() = host_id);

create policy "hosts update own listings"
on public.listings for update
to authenticated
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

create policy "hosts delete own listings"
on public.listings for delete
to authenticated
using (auth.uid() = host_id);

-- Listing photos
create policy "listing photos follow listing visibility"
on public.listing_photos for select
to anon, authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id
      and (l.status = 'published' or l.host_id = auth.uid())
  )
);

create policy "hosts manage listing photos"
on public.listing_photos for all
to authenticated
using (
  exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid())
)
with check (
  exists (select 1 from public.listings l where l.id = listing_id and l.host_id = auth.uid())
);

-- Booking requests
create policy "travelers create own requests"
on public.booking_requests for insert
to authenticated
with check (auth.uid() = traveler_id);

create policy "booking participants can read"
on public.booking_requests for select
to authenticated
using (
  auth.uid() = traveler_id
  or exists (
    select 1 from public.listings l
    where l.id = listing_id and l.host_id = auth.uid()
  )
);

create policy "travelers update own pending requests"
on public.booking_requests for update
to authenticated
using (auth.uid() = traveler_id and status in ('pending','cancelled'))
with check (auth.uid() = traveler_id);

create policy "hosts update requests for own listings"
on public.booking_requests for update
to authenticated
using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and l.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and l.host_id = auth.uid()
  )
);

-- Messages
create policy "booking participants read messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.booking_requests b
    join public.listings l on l.id = b.listing_id
    where b.id = booking_id
      and (b.traveler_id = auth.uid() or l.host_id = auth.uid())
  )
);

create policy "booking participants send messages"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.booking_requests b
    join public.listings l on l.id = b.listing_id
    where b.id = booking_id
      and (b.traveler_id = auth.uid() or l.host_id = auth.uid())
  )
);

-- Saved pads
create policy "users manage own saved pads"
on public.saved_pads for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Reviews
create policy "reviews are public"
on public.reviews for select
to anon, authenticated
using (true);

create policy "booking participants create reviews"
on public.reviews for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  and exists (
    select 1
    from public.booking_requests b
    join public.listings l on l.id = b.listing_id
    where b.id = booking_id
      and b.status = 'completed'
      and (b.traveler_id = auth.uid() or l.host_id = auth.uid())
  )
);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "public avatar viewing"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "users upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "public listing photo viewing"
on storage.objects for select
to public
using (bucket_id = 'listing-photos');

create policy "hosts upload listing photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
