-- =============================================================================
-- 014 — Explorer auth: profiles for travellers, wishlists, story posts
-- =============================================================================
-- Backward compatible with admin/editor/viewer/suspended roles.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS patterns).

-- ---------------------------------------------------------------------------
-- Profiles: explorer fields + role = user
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'editor', 'viewer', 'suspended', 'user'));

alter table public.profiles
  alter column role set default 'user';

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists provider text;

alter table public.profiles
  add column if not exists last_login timestamptz;

alter table public.profiles
  add column if not exists joined_at timestamptz not null default now();

alter table public.profiles
  add column if not exists explorer_points integer not null default 0
    check (explorer_points >= 0);

alter table public.profiles
  add column if not exists passport_level text not null default 'newcomer';

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists location text;

comment on table public.profiles is
  'Panora Go profiles — explorers (role=user) and Command Center staff.';

comment on column public.profiles.preferences is
  'Explorer prefs e.g. { "vibes": ["Nature","Food"], "onboarded": true }.';

comment on column public.profiles.passport_level is
  'Soft passport tier scaffold (newcomer → wanderer → …).';

-- Ensure explorers can insert/update their own row (idempotent re-create)
drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Wishlists (synced saved places)
-- ---------------------------------------------------------------------------
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  collection text not null default 'wishlist',
  created_at timestamptz not null default now(),
  unique (user_id, place_id, collection)
);

create index if not exists wishlists_user_id_idx
  on public.wishlists (user_id);

create index if not exists wishlists_place_id_idx
  on public.wishlists (place_id);

comment on table public.wishlists is
  'Explorer saved places. Default collection = wishlist; more collections later.';

alter table public.wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.wishlists;
create policy "wishlists_select_own"
  on public.wishlists for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "wishlists_insert_own" on public.wishlists;
create policy "wishlists_insert_own"
  on public.wishlists for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "wishlists_delete_own" on public.wishlists;
create policy "wishlists_delete_own"
  on public.wishlists for delete
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "wishlists_update_own" on public.wishlists;
create policy "wishlists_update_own"
  on public.wishlists for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Experience stories: authenticated explorers may submit (unpublished)
-- ---------------------------------------------------------------------------
alter table public.experience_stories
  add column if not exists author_user_id uuid references public.profiles (id) on delete set null;

create index if not exists experience_stories_author_user_id_idx
  on public.experience_stories (author_user_id);

drop policy if exists "stories_explorer_insert" on public.experience_stories;
create policy "stories_explorer_insert"
  on public.experience_stories for insert
  with check (
    auth.uid() is not null
    and (author_user_id is null or author_user_id = auth.uid())
    and published = false
  );
