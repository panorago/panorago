-- New This Week statuses and comments.
-- Safe to run more than once. Does not delete existing rows.

alter table public.places
  add column if not exists google_place_id text;

create table if not exists public.week_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text not null default '',
  image_url text,
  video_url text,
  place_id uuid references public.places (id) on delete set null,
  category text,
  published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists week_stories_public_idx
  on public.week_stories (published, published_at desc);

create table if not exists public.week_story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.week_stories (id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint week_story_comments_body_len check (char_length(body) between 1 and 280),
  constraint week_story_comments_name_len check (char_length(author_name) between 1 and 40)
);

create index if not exists week_story_comments_story_idx
  on public.week_story_comments (story_id, created_at);

alter table public.week_stories enable row level security;
alter table public.week_story_comments enable row level security;

drop policy if exists "public read published week stories" on public.week_stories;
create policy "public read published week stories"
  on public.week_stories
  for select
  using (
    published = true
    and (published_at is null or published_at <= now())
    and (expires_at is null or expires_at > now())
  );

drop policy if exists "public read week story comments" on public.week_story_comments;
create policy "public read week story comments"
  on public.week_story_comments
  for select
  using (
    exists (
      select 1
      from public.week_stories s
      where s.id = story_id
        and s.published = true
        and (s.expires_at is null or s.expires_at > now())
    )
  );
