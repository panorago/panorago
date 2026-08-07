-- Extend Command Center realtime: places publication + full replica identity
-- Safe after 007_realtime_publications.sql / 009_verify_lookup.sql
-- Run this if 007 was already applied without places / replica identity.

do $$
begin
  begin
    alter publication supabase_realtime add table public.places;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

do $$
begin
  begin
    alter table public.bookings replica identity full;
  exception
    when undefined_table then null;
  end;
  begin
    alter table public.place_submissions replica identity full;
  exception
    when undefined_table then null;
  end;
end $$;
