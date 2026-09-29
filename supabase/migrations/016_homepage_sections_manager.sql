-- Allow custom homepage sections and publish them for live admin sync.
-- Existing rows (trending, new_discoveries, panora_picks, weekend_escape,
-- editors_choice) stay valid.

alter table public.homepage_sections
  drop constraint if exists homepage_sections_key_check;

alter table public.homepage_sections
  add column if not exists section_type text not null default 'grid';

alter table public.homepage_sections
  drop constraint if exists homepage_sections_section_type_check;

alter table public.homepage_sections
  add constraint homepage_sections_section_type_check
  check (
    section_type in (
      'hero',
      'featured',
      'grid',
      'list',
      'cta',
      'testimonial',
      'about'
    )
  );

do $$
begin
  begin
    alter publication supabase_realtime add table public.homepage_sections;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
