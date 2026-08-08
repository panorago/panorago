-- =============================================================================
-- 015 — Wishlist save hardening
-- =============================================================================
-- Seed / client place IDs may be valid UUIDs that are not yet rows in `places`,
-- or non-UUID local keys. The FK on wishlists.place_id caused silent sync
-- failures (batch upsert aborted) so explorers thought saves worked locally
-- but never persisted — or worse, sync paths treated the error as fatal.
--
-- Change place_id to text and drop the places FK. RLS still scopes rows to
-- auth.uid(). Unique (user_id, place_id, collection) is preserved.

do $$
declare
  fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'wishlists'
    and c.contype = 'f'
    and pg_get_constraintdef(c.oid) ilike '%place_id%';

  if fk_name is not null then
    execute format('alter table public.wishlists drop constraint %I', fk_name);
  end if;
end $$;

alter table public.wishlists
  alter column place_id type text using place_id::text;

comment on column public.wishlists.place_id is
  'Saved place id (UUID or client/seed key). No FK — missing places rows must not block wishlist sync.';

-- Ensure unique constraint still exists after type change (idempotent).
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'wishlists'
      and c.contype = 'u'
      and c.conname = 'wishlists_user_id_place_id_collection_key'
  ) then
    alter table public.wishlists
      add constraint wishlists_user_id_place_id_collection_key
      unique (user_id, place_id, collection);
  end if;
end $$;
