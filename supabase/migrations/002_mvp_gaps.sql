-- MVP gap fills: feeling on stories, place verifications, enquiries
-- Safe to run after 001_panora_go.sql

-- ---------------------------------------------------------------------------
-- Experience stories / comments mood
-- ---------------------------------------------------------------------------
alter table public.experience_stories
  add column if not exists feeling text;

comment on column public.experience_stories.feeling is
  'Optional one-word mood from the guest (e.g. peaceful, awestruck). Mapped as comments.feeling in product language.';

-- ---------------------------------------------------------------------------
-- Place verification badge keys
-- ---------------------------------------------------------------------------
alter table public.places
  add column if not exists verifications jsonb not null default '[]'::jsonb;

comment on column public.places.verifications is
  'Array of verification keys: photos_verified, accurate_pricing, family_friendly, solar_power, borehole_water, starlink.';

create index if not exists places_verifications_gin_idx
  on public.places using gin (verifications);

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  place_id uuid references public.places (id) on delete set null,
  place_name text,
  preferred_date text,
  guests text,
  phone text,
  email text,
  budget text,
  special_request text,
  channel text check (
    channel is null
    or channel in ('whatsapp', 'email', 'call', 'web')
  ),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'closed', 'spam')
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

create index if not exists enquiries_place_id_idx
  on public.enquiries (place_id);

create index if not exists enquiries_code_idx
  on public.enquiries (code);

alter table public.enquiries enable row level security;

drop policy if exists "Public can insert enquiries" on public.enquiries;
create policy "Public can insert enquiries"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries"
  on public.enquiries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries"
  on public.enquiries
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
