-- Hero right panel and weekly peek, controlled from homepage_sections.
-- Uses the real columns (key, title, enabled). card_limit and vibe_filter are new.

alter table public.homepage_sections
  drop constraint if exists homepage_sections_key_check;

alter table public.homepage_sections
  add column if not exists card_limit integer not null default 3;

alter table public.homepage_sections
  add column if not exists vibe_filter text;

insert into public.homepage_sections (
  key,
  title,
  subtitle,
  sort_order,
  enabled,
  place_ids,
  card_limit,
  vibe_filter
)
values
  (
    'hero_right_panel',
    'Trending Now',
    'Hero — Right Panel Cards',
    0,
    true,
    '{}',
    3,
    'trending'
  ),
  (
    'hero_peek_strip',
    'New This Week',
    'Hero — Weekly Peek Strip',
    0,
    true,
    '{}',
    4,
    null
  )
on conflict (key) do nothing;

update public.homepage_sections
set card_limit = 3
where key = 'hero_right_panel';

update public.homepage_sections
set card_limit = 4
where key = 'hero_peek_strip';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'homepage_sections'
      and column_name = 'section_type'
  ) then
    update public.homepage_sections
    set section_type = 'hero'
    where key in ('hero_right_panel', 'hero_peek_strip');
  end if;
end $$;
