-- Gap closes: durable anti-dupe tokens + rate limit hits
-- Safe after 005_command_center.sql

create table if not exists public.submission_tokens (
  token_hash text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists submission_tokens_expires_idx
  on public.submission_tokens (expires_at);

create table if not exists public.rate_limit_hits (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_created_idx
  on public.rate_limit_hits (bucket, created_at desc);

alter table public.submission_tokens enable row level security;
alter table public.rate_limit_hits enable row level security;

-- Service role bypasses RLS; no public policies (server-only inserts).
