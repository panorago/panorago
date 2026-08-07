-- Realtime publications for Command Center live sync (toasts + refreshes)
-- Safe after 006_security_guards.sql

do $$
begin
  begin
    alter publication supabase_realtime add table public.bookings;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.place_submissions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.places;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- Full row images on UPDATE so status diffs are available to Realtime subscribers
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
