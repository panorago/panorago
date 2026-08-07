-- Place menu sneak-peek media + structured pricing items (backward compatible)

alter table public.places
  add column if not exists menu_image_urls text[] not null default '{}';

comment on column public.places.menu_image_urls is
  'Ordered menu / price-list photo URLs for the pricing sneak peek on place pages.';

alter table public.places
  add column if not exists pricing_items jsonb not null default '[]'::jsonb;

comment on column public.places.pricing_items is
  'Optional structured pricing rows [{label, price}] for the sneak peek section.';
