-- Panora Command Center schema extensions
-- Safe to run after 004_concierge.sql (and earlier migrations 001–003)
-- Run this SQL in the Supabase SQL editor (or via CLI) before relying on new admin modules.

-- ---------------------------------------------------------------------------
-- Places: paid listings, feature / archive flags
-- ---------------------------------------------------------------------------
alter table public.places
  add column if not exists paid_tier text not null default 'basic'
    check (paid_tier in ('basic', 'silver', 'gold', 'platinum'));

alter table public.places
  add column if not exists featured boolean not null default false;

alter table public.places
  add column if not exists archived boolean not null default false;

create index if not exists places_paid_tier_idx on public.places (paid_tier);
create index if not exists places_featured_idx on public.places (featured)
  where featured = true and archived = false;
create index if not exists places_archived_idx on public.places (archived);

comment on column public.places.paid_tier is
  'Paid listing tier: basic | silver | gold | platinum. Higher tiers sort / feature preferentially.';
comment on column public.places.featured is
  'Editorial / paid feature flag for homepage and discover ranking.';
comment on column public.places.archived is
  'Soft-archive — hidden from public listings but retained for admin.';

-- ---------------------------------------------------------------------------
-- Experience stories: pin + report
-- ---------------------------------------------------------------------------
alter table public.experience_stories
  add column if not exists pinned boolean not null default false;

alter table public.experience_stories
  add column if not exists reported boolean not null default false;

create index if not exists experience_stories_pinned_idx
  on public.experience_stories (pinned)
  where pinned = true;

-- ---------------------------------------------------------------------------
-- Profiles: expand roles for Command Center user management
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'editor', 'viewer', 'suspended'));

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- Secret collections (curated lists beyond homepage sections)
-- ---------------------------------------------------------------------------
create table if not exists public.secret_collections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  subtitle text not null default '',
  sort_order integer not null default 0,
  enabled boolean not null default true,
  place_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists secret_collections_enabled_sort_idx
  on public.secret_collections (enabled, sort_order);

drop trigger if exists secret_collections_set_updated_at on public.secret_collections;
create trigger secret_collections_set_updated_at
  before update on public.secret_collections
  for each row execute function public.set_updated_at();

alter table public.secret_collections enable row level security;

drop policy if exists "Public can read enabled collections" on public.secret_collections;
create policy "Public can read enabled collections"
  on public.secret_collections
  for select
  to anon, authenticated
  using (enabled = true);

drop policy if exists "Admins manage collections" on public.secret_collections;
create policy "Admins manage collections"
  on public.secret_collections
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Place submissions (public Add Your Place → admin approval)
-- ---------------------------------------------------------------------------
create table if not exists public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitter_name text not null,
  submitter_email text,
  submitter_phone text,
  place_name text not null,
  location text not null default '',
  city text not null default 'Harare',
  country text not null default 'Zimbabwe',
  category text not null default 'dining',
  story text not null default '',
  website text,
  whatsapp text,
  latitude double precision,
  longitude double precision,
  hero_image text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_place_id uuid references public.places (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists place_submissions_status_idx
  on public.place_submissions (status, created_at desc);

drop trigger if exists place_submissions_set_updated_at on public.place_submissions;
create trigger place_submissions_set_updated_at
  before update on public.place_submissions
  for each row execute function public.set_updated_at();

alter table public.place_submissions enable row level security;

drop policy if exists "Public can insert place submissions" on public.place_submissions;
create policy "Public can insert place submissions"
  on public.place_submissions
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins manage place submissions" on public.place_submissions;
create policy "Admins manage place submissions"
  on public.place_submissions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Site settings (single-row jsonb store)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id text primary key default 'default',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.site_settings (id, settings)
values (
  'default',
  '{
    "whatsapp": "",
    "email": "",
    "phone": "",
    "phoneDisplay": "",
    "heroVideoUrl": "",
    "instagram": "",
    "facebook": "",
    "tiktok": "",
    "mapsApiKeyNote": "Use NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser key only)."
  }'::jsonb
)
on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Media library metadata (files live in Storage buckets)
-- ---------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  public_url text,
  filename text not null,
  content_type text,
  size_bytes bigint,
  alt text not null default '',
  tags text[] not null default '{}',
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create index if not exists media_assets_created_at_idx
  on public.media_assets (created_at desc);

alter table public.media_assets enable row level security;

drop policy if exists "Admins manage media assets" on public.media_assets;
create policy "Admins manage media assets"
  on public.media_assets
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);

create index if not exists audit_log_entity_idx
  on public.audit_log (entity_type, entity_id);

alter table public.audit_log enable row level security;

drop policy if exists "Admins read audit log" on public.audit_log;
create policy "Admins read audit log"
  on public.audit_log
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins insert audit log" on public.audit_log;
create policy "Admins insert audit log"
  on public.audit_log
  for insert
  to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Analytics events (lightweight first-party)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  place_id uuid references public.places (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  visitor_key text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_name_idx
  on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Anyone can insert analytics events" on public.analytics_events;
create policy "Anyone can insert analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins read analytics events" on public.analytics_events;
create policy "Admins read analytics events"
  on public.analytics_events
  for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: media library bucket (booking-assets created in 004_concierge.sql)
-- Create in Dashboard → Storage if insert fails due to permissions.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
