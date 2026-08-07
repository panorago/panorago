-- =============================================================================
-- Panora Go — full database deploy (Supabase SQL Editor)
-- =============================================================================
-- Paste this entire script into the Supabase Dashboard → SQL Editor and run it
-- on a fresh project database (requires Supabase Auth / auth.users).
--
-- Contents are migrations 001 → 010 concatenated in order:
--   001_panora_go.sql
--   002_mvp_gaps.sql
--   003_bookings.sql
--   004_concierge.sql
--   005_command_center.sql
--   006_security_guards.sql
--   007_realtime_publications.sql
--   008_admin_credentials.sql
--   009_verify_lookup.sql
--   010_realtime_places_replica.sql
--
-- Safe for a fresh DB: uses IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT /
-- DROP … IF EXISTS patterns from the source migrations (plus DROP POLICY IF EXISTS
-- before policies that originally lacked it in 001, so a second paste no-ops
-- instead of failing on duplicate policy names).
--
-- If the database is already partially migrated, prefer running only the
-- remaining individual files under supabase/migrations/, OR accept that many
-- create-if-not-exists statements will no-op while a few non-idempotent bits
-- (noted below / near those statements) may still need care on re-run.
--
-- Do not treat this file as an ordered Supabase CLI migration; keep running
-- individual files under supabase/migrations/ for incremental environments.
-- =============================================================================


-- #############################################################################
-- SECTION: 001_panora_go.sql
-- Source: supabase/migrations/001_panora_go.sql
-- #############################################################################

-- Panora Go schema
-- Run against Supabase Postgres. Requires auth.users from Supabase Auth.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (admin gate for RLS)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Admin profiles linked to auth.users for Panora Go CMS access.';

-- ---------------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------------
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text not null,
  city text not null,
  country text not null default 'Zimbabwe',
  latitude double precision,
  longitude double precision,
  category text not null check (
    category in (
      'dining',
      'escape',
      'nightlife',
      'wellness',
      'culture',
      'outdoors',
      'coffee',
      'weekend'
    )
  ),
  mood jsonb not null default '[]'::jsonb,
  story text not null,
  panora_notes text not null default '',
  highlights jsonb not null default '{}'::jsonb,
  amenities jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  price_guide text not null default '',
  distance_km double precision,
  verified boolean not null default false,
  published boolean not null default false,
  hero_image text not null,
  gallery text[] not null default '{}',
  meta_title text,
  meta_description text,
  homepage_sections jsonb not null default '[]'::jsonb,
  -- Future merchant / partner ownership (nullable until merchants ship)
  merchant_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.places.merchant_id is
  'Future-ready nullable merchant/partner owner id. Not enforced until merchant accounts ship.';

comment on column public.places.gallery is
  'Ordered list of image URLs. Optional place_images table can replace this later.';

-- Optional normalized images (gallery text[] remains primary for v1)
create table if not exists public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  is_hero boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Experience stories
-- ---------------------------------------------------------------------------
create table if not exists public.experience_stories (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  author_name text not null,
  body text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Visitor-based likes (no auth account required)
create table if not exists public.story_likes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.experience_stories (id) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (story_id, visitor_key)
);

-- ---------------------------------------------------------------------------
-- Homepage sections
-- ---------------------------------------------------------------------------
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (
    key in (
      'trending',
      'new_discoveries',
      'panora_picks',
      'weekend_escape',
      'editors_choice'
    )
  ),
  title text not null,
  subtitle text not null default '',
  sort_order integer not null default 0,
  enabled boolean not null default true,
  place_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists places_slug_idx on public.places (slug);
create index if not exists places_published_idx on public.places (published);
create index if not exists places_homepage_sections_gin_idx
  on public.places using gin (homepage_sections);
create index if not exists places_mood_gin_idx on public.places using gin (mood);
create index if not exists places_city_idx on public.places (city);
create index if not exists experience_stories_place_id_idx
  on public.experience_stories (place_id);
create index if not exists experience_stories_published_idx
  on public.experience_stories (published);
create index if not exists story_likes_story_id_idx on public.story_likes (story_id);
create index if not exists place_images_place_id_idx on public.place_images (place_id);
create index if not exists homepage_sections_enabled_sort_idx
  on public.homepage_sections (enabled, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_set_updated_at on public.places;
create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at
  before update on public.homepage_sections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_images enable row level security;
alter table public.experience_stories enable row level security;
alter table public.story_likes enable row level security;
alter table public.homepage_sections enable row level security;

-- Profiles: users read/update own row; admins full access
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
  on public.profiles for delete
  using (public.is_admin());

-- Places: public read published; admin full access
drop policy if exists "places_public_read_published" on public.places;
create policy "places_public_read_published"
  on public.places for select
  using (published = true or public.is_admin());

drop policy if exists "places_admin_insert" on public.places;
create policy "places_admin_insert"
  on public.places for insert
  with check (public.is_admin());

drop policy if exists "places_admin_update" on public.places;
create policy "places_admin_update"
  on public.places for update
  using (public.is_admin());

drop policy if exists "places_admin_delete" on public.places;
create policy "places_admin_delete"
  on public.places for delete
  using (public.is_admin());

-- Place images
drop policy if exists "place_images_public_read" on public.place_images;
create policy "place_images_public_read"
  on public.place_images for select
  using (
    exists (
      select 1 from public.places p
      where p.id = place_id and (p.published = true or public.is_admin())
    )
  );

drop policy if exists "place_images_admin_all" on public.place_images;
create policy "place_images_admin_all"
  on public.place_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- Experience stories: public read published; admin write
drop policy if exists "stories_public_read_published" on public.experience_stories;
create policy "stories_public_read_published"
  on public.experience_stories for select
  using (published = true or public.is_admin());

drop policy if exists "stories_admin_insert" on public.experience_stories;
create policy "stories_admin_insert"
  on public.experience_stories for insert
  with check (public.is_admin());

drop policy if exists "stories_admin_update" on public.experience_stories;
create policy "stories_admin_update"
  on public.experience_stories for update
  using (public.is_admin());

drop policy if exists "stories_admin_delete" on public.experience_stories;
create policy "stories_admin_delete"
  on public.experience_stories for delete
  using (public.is_admin());

-- Story likes: anyone can insert (visitor key); public can read; admin delete
drop policy if exists "story_likes_public_select" on public.story_likes;
create policy "story_likes_public_select"
  on public.story_likes for select
  using (true);

drop policy if exists "story_likes_public_insert" on public.story_likes;
create policy "story_likes_public_insert"
  on public.story_likes for insert
  with check (true);

drop policy if exists "story_likes_admin_delete" on public.story_likes;
create policy "story_likes_admin_delete"
  on public.story_likes for delete
  using (public.is_admin());

-- Homepage sections: public read enabled; admin full
drop policy if exists "homepage_sections_public_read" on public.homepage_sections;
create policy "homepage_sections_public_read"
  on public.homepage_sections for select
  using (enabled = true or public.is_admin());

drop policy if exists "homepage_sections_admin_all" on public.homepage_sections;
create policy "homepage_sections_admin_all"
  on public.homepage_sections for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket policies for `place-images`
-- Create the bucket in Supabase Dashboard (Storage â†’ New bucket â†’ place-images)
-- as a public bucket, then apply policies similar to:
--
-- insert into storage.buckets (id, name, public)
-- values ('place-images', 'place-images', true)
-- on conflict (id) do nothing;
--
-- create policy "place_images_public_read"
--   on storage.objects for select
--   using (bucket_id = 'place-images');
--
-- create policy "place_images_admin_upload"
--   on storage.objects for insert
--   with check (bucket_id = 'place-images' and public.is_admin());
--
-- create policy "place_images_admin_update"
--   on storage.objects for update
--   using (bucket_id = 'place-images' and public.is_admin());
--
-- create policy "place_images_admin_delete"
--   on storage.objects for delete
--   using (bucket_id = 'place-images' and public.is_admin());
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Seed: 8 curated places
-- ---------------------------------------------------------------------------
insert into public.places (
  id, slug, name, location, city, country, latitude, longitude, category,
  mood, story, panora_notes, highlights, amenities, contact, price_guide,
  distance_km, verified, published, hero_image, gallery, meta_title,
  meta_description, homepage_sections, created_at, updated_at
) values
(
  '11111111-1111-4111-8111-111111111101',
  'amanzi-restaurant',
  'Amanzi',
  'Sam Nujoma Avenue, Belgravia',
  'Harare',
  'Zimbabwe',
  -17.8042,
  31.0445,
  'dining',
  '["Date Night","Quiet Luxury","Golden Hour"]'::jsonb,
  'Hidden beneath a canopy of old jacarandas, Amanzi unfolds like a whispered invitation. Soft light pools across white linen as the last heat of the day dissolves into the garden. You arrive not for a meal, but for the pause between conversations â€” the clink of glass, the slow pour of a Cape blend, the scent of woodsmoke drifting from the open kitchen. Plates arrive as stories: charcoal-grilled bream with a quiet confidence, garden herbs that taste like someone actually grew them. The evening stretches. Nobody rushes you. Outside the gate, Harare keeps moving; inside, time softens into something you will remember for years.',
  'Book the garden table near the fountain if you want privacy without feeling banished. Ask for the seasonal tasting menu on Fridays â€” it changes with what the farms deliver. Arrive thirty minutes before sunset; the light through the jacarandas is the real aperitif. Cash and Visa both work, but USD cash still gets the smoother smile. Parking fills early on weekends â€” use the Belgravia side entrance.',
  '{"goldenHour":"Garden tables under jacarandas from 5:30â€“6:30pm","bestTime":"Thursdayâ€“Saturday dinner; weekday lunch for quieter tables","dressVibe":"Smart casual â€” linen, clean shoes, no sportswear","noiseLevel":"Soft conversation; music stays under the chatter","perfectFor":["Anniversaries","First impressions","Quiet celebrations"],"paymentMethods":["USD cash","Visa","EcoCash"],"averageSpend":"$25â€“40 pp","openingHours":"Tueâ€“Sun 12:00â€“22:00; closed Mondays"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"outdoorSeating":true,"wheelchairAccess":true,"kidFriendly":false,"petFriendly":false,"music":true,"photography":true,"phoneSignal":"strong","roadCondition":"excellent","power":true,"solar":true}'::jsonb,
  '{"whatsapp":"+263772123456","phone":"+263242794567","email":"reservations@amanzi.co.zw","website":"https://amanzi.co.zw","instagram":"@amanzirestaurant","googleMapsUrl":"https://maps.google.com/?q=Amanzi+Restaurant+Harare"}'::jsonb,
  '$25â€“40 pp',
  4.2,
  true,
  true,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80'
  ],
  'Amanzi Restaurant Harare â€” Garden Fine Dining | Panora Go',
  'Discover Amanzi in Belgravia, Harare â€” garden dining under jacarandas with seasonal plates, soft light, and date-night atmosphere. Insider tips from Panora Go.',
  '["trending","panora_picks","editors_choice"]'::jsonb,
  '2025-11-12T08:00:00.000Z',
  '2026-07-18T14:30:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111102',
  'ginkgo-coffee-house',
  'Ginkgo Coffee House',
  'Borrowdale Brooke Village',
  'Harare',
  'Zimbabwe',
  -17.7568,
  31.0889,
  'coffee',
  '["Coffee Ritual","Quiet Luxury"]'::jsonb,
  'Morning at Ginkgo begins before the rush â€” the grinders warm, the first pour-over blooms, steam curls toward high windows that catch Borrowdale light. You sit with a flat white that tastes like someone cared about the milk temperature. Laptop lids open. Soft conversations about nothing urgent. The pastry case holds croissants that flake the way they should, and a lemon tart that arrives looking almost too composed. This is not a pit stop. It is the hour you reclaim before the city asks for everything else. Stay long enough and the room becomes a quiet membership of people who know how to start a day properly.',
  'The corner table by the east window is the prize â€” arrive before 8:15am on weekdays. Their single-origin filter rotates monthly; ask what is on the Chemex. Card machines can be slow after load shedding â€” keep a few USD notes ready. The almond croissant sells out by 10am on Saturdays. Parking is easier if you enter from the Brooke side rather than the main road.',
  '{"goldenHour":"Morning light through east windows until ~9:30am","bestTime":"Weekday mornings 7:30â€“10:00; Saturday brunch before 11","dressVibe":"Relaxed â€” jeans, sneakers, work-from-cafÃ© energy","noiseLevel":"Gentle hum; good for reading and light calls","perfectFor":["Solo mornings","Catch-ups","Remote work stretches"],"paymentMethods":["USD cash","Visa","EcoCash","OneMoney"],"averageSpend":"$6â€“12 pp","openingHours":"Monâ€“Sun 07:00â€“17:00"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"outdoorSeating":true,"wheelchairAccess":true,"kidFriendly":true,"power":true,"solar":true,"phoneSignal":"strong","roadCondition":"excellent","photography":true}'::jsonb,
  '{"whatsapp":"+263773456789","phone":"+263242885120","email":"hello@ginkgocoffee.co.zw","instagram":"@ginkgocoffeehouse","facebook":"Ginkgo Coffee House Harare","googleMapsUrl":"https://maps.google.com/?q=Ginkgo+Coffee+Borrowdale+Harare"}'::jsonb,
  '$6â€“12 pp',
  12.5,
  true,
  true,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73839982?w=1600&q=80'
  ],
  'Ginkgo Coffee House Borrowdale â€” Harare CafÃ© Ritual | Panora Go',
  'Find Ginkgo Coffee House in Borrowdale Brooke â€” pour-overs, quiet tables, and the morning light Harare regulars protect. Panora Go insider notes included.',
  '["new_discoveries","panora_picks"]'::jsonb,
  '2025-12-03T09:15:00.000Z',
  '2026-06-22T11:00:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111103',
  'victoria-falls-river-lodge',
  'Victoria Falls River Lodge',
  'Zambezi National Park',
  'Victoria Falls',
  'Zimbabwe',
  -17.8915,
  25.8232,
  'escape',
  '["Weekend Away","Quiet Luxury","Golden Hour"]'::jsonb,
  'The Zambezi does not perform for you. It simply moves â€” wide, bronze, endlessly patient â€” while your lodge deck holds the silence between hippo calls. Soft light finds the water first, then the canvas of your suite, then the coffee tray left without a knock. Days here are measured in river drifts and the hush before dinner, when the sky turns the colour of apricot jam. You dress lightly. You speak less. Somewhere beyond the reeds, elephants cross as if the land still belongs to them. Victoria Falls is twenty minutes away; the feeling of having arrived somewhere older than tourism is right here, on this bank, with nothing urgent left to prove.',
  'Request a river-facing suite â€” the difference is not subtle. Golden hour from the main deck is non-negotiable; bring a light shawl even in summer. Book the private canoe at first light rather than midday. Transfers from Vic Falls town take ~25 minutes on a fair road. Starlink is reliable for urgent work; still, leave the laptop closed if you can. Ask the lodge about the seasonal migration sightings before you plan game drives.',
  '{"goldenHour":"River deck facing west â€” 5:15â€“6:15pm depending on season","bestTime":"Mayâ€“October for clear skies; November for dramatic storms","dressVibe":"Resort casual â€” linen, sandals, something nicer for dinner","noiseLevel":"Nature soundtrack; lodge keeps evenings low-key","perfectFor":["Couples","Milestone trips","Digital detox weekends"],"paymentMethods":["USD cash","Visa","Mastercard"],"averageSpend":"From $450 / night","openingHours":"Lodge reception 06:00â€“22:00; dining by reservation"}'::jsonb,
  '{"wifi":true,"starlink":true,"swimming":true,"parking":true,"security":true,"outdoorSeating":true,"fireplace":true,"kidFriendly":true,"power":true,"solar":true,"borehole":true,"photography":true,"phoneSignal":"moderate","roadCondition":"good"}'::jsonb,
  '{"whatsapp":"+263778901234","phone":"+26321328421","email":"stay@vicfallsriverlodge.com","website":"https://vicfallsriverlodge.com","instagram":"@vicfallsriverlodge","facebook":"Victoria Falls River Lodge","googleMapsUrl":"https://maps.google.com/?q=Victoria+Falls+River+Lodge+Zimbabwe"}'::jsonb,
  'From $450 / night',
  null,
  true,
  true,
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1600&q=80'
  ],
  'Victoria Falls River Lodge â€” Zambezi Escape | Panora Go',
  'Stay on the Zambezi at Victoria Falls River Lodge â€” river suites, golden hour decks, and quiet luxury minutes from the Falls. Curated by Panora Go.',
  '["weekend_escape","editors_choice","trending"]'::jsonb,
  '2025-10-01T10:00:00.000Z',
  '2026-07-01T16:45:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111104',
  'nyanga-pine-cottage',
  'Nyanga Pine Cottage',
  'Troutbeck Valley',
  'Nyanga',
  'Zimbabwe',
  -18.2167,
  32.7333,
  'weekend',
  '["Hidden Escape","Weekend Away","Quiet Luxury"]'::jsonb,
  'Mist hangs between the pines like a held breath. Nyanga Pine Cottage sits off a gravel spur where the air turns cool enough to want a sweater in July and a fireplace in every season that matters. You wake to birds you cannot name and coffee that tastes better because nobody is waiting on you. Days blur into walks along trout streams, long lunches on the verandah, and the soft decision to stay one more night. Soft light filters through needles onto stone floors. The city feels theoretical. This is the version of Zimbabwe that lives in the highlands â€” green, quiet, slightly forgotten â€” and that is exactly why you come.',
  'The last 4km is gravel â€” a regular sedan manages it carefully in dry weather; 4x4 preferred after rain. Stock up in Rusape or Juliasdale; the cottage kitchen is fully equipped but shops close early. Bring cash for the caretaker tip and roadside avocado sellers. Book Fridayâ€“Sunday for peak misty mornings. The fireplace wood is provided â€” ask for extra if nights look cold. Starlink works from the main lounge; bedroom signal is weaker.',
  '{"goldenHour":"Verandah facing the valley â€” late afternoon mist glow","bestTime":"Aprilâ€“August for crisp air; September for wildflowers","dressVibe":"Layers â€” mornings cold, afternoons mild","noiseLevel":"Near silence; only wind and birds","perfectFor":["Couples","Writing retreats","Slow weekends"],"paymentMethods":["USD cash","EcoCash","Bank transfer"],"averageSpend":"From $80 / night","openingHours":"Self-catering; check-in from 14:00, check-out by 10:00"}'::jsonb,
  '{"wifi":true,"starlink":true,"fireplace":true,"parking":true,"security":true,"outdoorSeating":true,"kidFriendly":true,"petFriendly":true,"power":true,"solar":true,"borehole":true,"phoneSignal":"weak","roadCondition":"fair","photography":true}'::jsonb,
  '{"whatsapp":"+263771112233","phone":"+2632722940","email":"book@nyangapinecottage.co.zw","instagram":"@nyangapinecottage","googleMapsUrl":"https://maps.google.com/?q=Troutbeck+Nyanga+Zimbabwe"}'::jsonb,
  'From $80 / night',
  null,
  true,
  true,
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80'
  ],
  'Nyanga Pine Cottage â€” Highland Weekend Escape | Panora Go',
  'Escape to Nyanga Pine Cottage in Troutbeck Valley â€” misty pines, fireplace nights, and quiet highland air. Panora Go weekend guide and booking notes.',
  '["weekend_escape","new_discoveries"]'::jsonb,
  '2026-01-08T12:00:00.000Z',
  '2026-07-10T09:20:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111105',
  'kariba-houseboat-serenity',
  'Houseboat Serenity',
  'Andora Harbour',
  'Kariba',
  'Zimbabwe',
  -16.5167,
  28.8000,
  'outdoors',
  '["Golden Hour","Weekend Away","Celebration"]'::jsonb,
  'On Kariba, the horizon is the only clock that matters. Houseboat Serenity drifts into coves where the water turns copper and the hills go black against the sky. Soft light spills across the upper deck as someone opens a cold drink and nobody checks their phone. You fish, or you pretend to. You swim when the captain says it is safe. At dusk the lake holds its breath and the first stars arrive early. This is celebration without confetti â€” birthdays, reunions, the decision to finally take a long weekend. The boat rocks gently. Conversations deepen. Somewhere a fish eagle calls, and you understand why people keep coming back to this inland sea.',
  'Charter for a minimum of two nights if you want the full rhythm â€” day trips feel rushed. Confirm fuel and ice inclusions before you board. Soft drinks and ice sell out at Andora Harbour early on Fridays; stock in town first. Sunset is best from the upper deck facing west toward the Matusadona silhouette. Bring reef-safe sunscreen and a light jacket for night breezes. Card payments on the harbour can be unreliable â€” USD cash rules.',
  '{"goldenHour":"Upper deck west-facing â€” 5:00â€“6:00pm most months","bestTime":"Aprilâ€“October for calmer water; avoid peak wind weeks in Aug","dressVibe":"Swimwear by day, easy layers by night","noiseLevel":"Generator hum at night; otherwise lake quiet","perfectFor":["Groups of 6â€“10","Birthdays","Friend reunions"],"paymentMethods":["USD cash","Bank transfer"],"averageSpend":"From $180 / night (whole boat)","openingHours":"Charters by arrangement; boarding from 14:00"}'::jsonb,
  '{"swimming":true,"parking":true,"security":true,"outdoorSeating":true,"kidFriendly":true,"power":true,"solar":true,"music":true,"photography":true,"phoneSignal":"moderate","roadCondition":"good"}'::jsonb,
  '{"whatsapp":"+263774445566","phone":"+263261214567","email":"charter@serenitykariba.com","website":"https://serenitykariba.com","instagram":"@houseboatserenity","facebook":"Houseboat Serenity Kariba","googleMapsUrl":"https://maps.google.com/?q=Andora+Harbour+Kariba"}'::jsonb,
  'From $180 / night',
  null,
  true,
  true,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1600&q=80'
  ],
  'Houseboat Serenity Kariba â€” Lake Charter Escape | Panora Go',
  'Charter Houseboat Serenity on Lake Kariba â€” copper sunsets, cove swimming, and celebration weekends on the water. Insider tips from Panora Go.',
  '["weekend_escape","trending"]'::jsonb,
  '2025-09-20T07:30:00.000Z',
  '2026-05-14T13:10:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111106',
  'matobo-hills-lodge',
  'Matobo Hills Lodge',
  'Matobo National Park fringe',
  'Bulawayo',
  'Zimbabwe',
  -20.5500,
  28.5000,
  'culture',
  '["Hidden Escape","Quiet Luxury","Golden Hour"]'::jsonb,
  'The granite balancing rocks of Matobo do not need explanation. They simply stand â€” ancient, improbable, catching soft light that turns pink then gold then violet. Matobo Hills Lodge sits among them without competing. You walk at dawn with a guide who speaks of rock art and rhinos in the same quiet breath. Afternoons dissolve into shade and cold drinks. Evenings bring a fire pit and the sense that civilisation is far enough away to forget its noise. This is not a checklist visit. It is a place that rearranges your sense of scale â€” of time, of landscape, of what a weekend can hold when you stop trying to fill every hour.',
  'Stay at least two nights â€” one day is not enough for both the cultural and wildlife circuits. Morning game drives beat afternoon heat for rhino tracking. Bring closed shoes for granite scrambling. The lodge can arrange a private rock-art walk with a knowledgeable local guide â€” worth every dollar. Bulawayo is about 40 minutes; stock snacks before you leave town. Evenings get cool; pack a fleece year-round.',
  '{"goldenHour":"Balancing rocks viewpoint behind the lodge â€” 5:20â€“6:10pm","bestTime":"Mayâ€“September for wildlife and clear skies","dressVibe":"Practical chic â€” khaki, linen, sturdy shoes","noiseLevel":"Very quiet; lodge evenings around the fire","perfectFor":["Thoughtful travellers","Photography","Cultural weekends"],"paymentMethods":["USD cash","Visa","Bank transfer"],"averageSpend":"From $220 / night","openingHours":"Lodge open year-round; activities by booking"}'::jsonb,
  '{"wifi":true,"swimming":true,"parking":true,"security":true,"outdoorSeating":true,"fireplace":true,"kidFriendly":true,"power":true,"solar":true,"borehole":true,"photography":true,"phoneSignal":"moderate","roadCondition":"fair"}'::jsonb,
  '{"whatsapp":"+263775556677","phone":"+263292401234","email":"hello@matobohillslodge.com","website":"https://matobohillslodge.com","instagram":"@matobohillslodge","facebook":"Matobo Hills Lodge","googleMapsUrl":"https://maps.google.com/?q=Matobo+National+Park+Zimbabwe"}'::jsonb,
  'From $220 / night',
  null,
  true,
  true,
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80',
    'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1600&q=80'
  ],
  'Matobo Hills Lodge â€” Granite & Quiet Luxury | Panora Go',
  'Experience Matobo Hills Lodge near Bulawayo â€” balancing rocks, rhino walks, and fire-pit evenings in ancient granite country. Curated by Panora Go.',
  '["editors_choice","panora_picks"]'::jsonb,
  '2025-08-15T11:00:00.000Z',
  '2026-06-01T10:00:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111107',
  'the-basement-harare',
  'The Basement',
  'Avondale Shopping Centre',
  'Harare',
  'Zimbabwe',
  -17.8045,
  31.0280,
  'nightlife',
  '["Tonight","Celebration","Date Night"]'::jsonb,
  'You hear The Basement before you see it â€” a low bassline leaking up the stairs, laughter already mid-sentence. Soft light, amber and intentional, finds the edges of faces and leaves the rest to mystery. This is Harare after dark without the hard sell: good cocktails, a DJ who reads the room, and a crowd that dresses like they meant to be seen. You order something with citrus and smoke. Someone you know appears. The night expands. You came for one drink and stayed for the feeling that the city still knows how to gather. When you leave, the cool air on Avondale Road feels like a soft landing.',
  'Fridays after 10pm are peak â€” arrive by 9 if you want a booth. The signature smoked old fashioned is worth the wait. Cover charge appears on big nights; keep USD cash for the door. Security is solid; still, park in the lit Avondale lot. Music volume climbs after midnight â€” great for dancing, less ideal for deep conversation. Dress code is unspoken but real: look like you tried.',
  '{"goldenHour":"Not a daylight spot â€” golden hour is 21:00â€“22:30 soft start","bestTime":"Friday and Saturday from 21:00; Thursday for locals'' night","dressVibe":"Smart nightlife â€” no flip-flops, no sports kits","noiseLevel":"Loud after 23:00; earlier hours are conversational","perfectFor":["Birthday groups","Date nights that start late","Dancing"],"paymentMethods":["USD cash","Visa","EcoCash"],"averageSpend":"$15â€“30 pp","openingHours":"Thuâ€“Sat 19:00â€“02:00; occasional Wed specials"}'::jsonb,
  '{"parking":true,"security":true,"music":true,"photography":true,"power":true,"phoneSignal":"strong","roadCondition":"excellent"}'::jsonb,
  '{"whatsapp":"+263776667788","phone":"+263242334455","email":"events@thebasementhre.com","instagram":"@thebasementhre","facebook":"The Basement Harare","tiktok":"@thebasementhre","googleMapsUrl":"https://maps.google.com/?q=Avondale+Shopping+Centre+Harare"}'::jsonb,
  '$15â€“30 pp',
  3.8,
  true,
  true,
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1600&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1600&q=80'
  ],
  'The Basement Harare â€” Avondale Nightlife | Panora Go',
  'Tonight at The Basement in Avondale â€” cocktails, amber light, and Harare nightlife with intention. Dress codes, timing, and tips from Panora Go.',
  '["trending","new_discoveries"]'::jsonb,
  '2026-02-14T16:00:00.000Z',
  '2026-07-25T18:00:00.000Z'
),
(
  '11111111-1111-4111-8111-111111111108',
  'meikles-spa-sanctuary',
  'Meikles Spa Sanctuary',
  'Meikles Hotel, Jason Moyo Avenue',
  'Harare',
  'Zimbabwe',
  -17.8292,
  31.0522,
  'wellness',
  '["Quiet Luxury","Hidden Escape"]'::jsonb,
  'Downtown Harare disappears the moment the spa door closes. Soft light, warm stone, the faint scent of eucalyptus â€” Meikles Spa Sanctuary is a pocket of stillness in the middle of the CBD. You change into a robe. Your shoulders drop without being asked. Treatments here do not rush; therapists move with a calm that feels practiced over years, not shifts. Afterward you sit with herbal tea and watch the city through glass, suddenly distant. This is not indulgence for its own sake. It is the reset between a hard week and whatever comes next â€” a quiet luxury that locals book when they need to remember their own edges.',
  'Book midweek mornings for the quietest rooms. The deep-tissue with hot stones is the house favourite for desk-bound backs. Arrive 20 minutes early for the steam room â€” it is included and often overlooked. Parking under the hotel is secure and worth the fee. Couple''s suites need advance notice. Ask for the CBD noise-cancelling tip: request a room on the inner courtyard side.',
  '{"goldenHour":"Post-treatment lounge with city views â€” late afternoon calm","bestTime":"Tueâ€“Thu 09:00â€“13:00 for fewest guests","dressVibe":"Arrive as you are; robes provided","noiseLevel":"Whisper-quiet treatment rooms","perfectFor":["Solo resets","Pre-event calm","Gift experiences"],"paymentMethods":["USD cash","Visa","Mastercard","EcoCash"],"averageSpend":"$45â€“90 / treatment","openingHours":"Monâ€“Sat 09:00â€“19:00; Sun 10:00â€“16:00"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"wheelchairAccess":true,"swimming":true,"power":true,"solar":true,"phoneSignal":"strong","roadCondition":"excellent"}'::jsonb,
  '{"whatsapp":"+263777778889","phone":"+263242707721","email":"spa@meikles.com","website":"https://meikles.com/spa","instagram":"@meiklesspa","facebook":"Meikles Hotel Harare","googleMapsUrl":"https://maps.google.com/?q=Meikles+Hotel+Harare"}'::jsonb,
  '$45â€“90 / treatment',
  1.2,
  true,
  true,
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1600&q=80'
  ],
  'Meikles Spa Sanctuary Harare â€” CBD Wellness | Panora Go',
  'Reset at Meikles Spa Sanctuary in central Harare â€” quiet treatments, steam, and soft light away from the CBD rush. Book tips from Panora Go.',
  '["panora_picks","editors_choice"]'::jsonb,
  '2025-11-28T08:45:00.000Z',
  '2026-07-05T12:30:00.000Z'
)
on conflict (id) do nothing;

-- Seed stories
insert into public.experience_stories (
  id, place_id, author_name, body, likes_count, published, created_at
) values
('22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','Tendai M.','We sat under the jacarandas as the sky went lavender and nobody checked the time. My partner ordered the bream; I barely remember my own plate because the evening felt like it belonged only to us. The waiters never hovered. When we finally left, the garden still smelled like rain even though it had not rained.',47,true,'2026-03-12T19:40:00.000Z'),
('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111101','Rudo K.','I brought my parents for their anniversary. Soft light on white linen, a bottle of something Cape, and my mother laughing in a way I had not heard in months. Amanzi made the city feel gentle again. I still think about the dessert â€” dark chocolate, a little salt, the kind of ending you do not rush.',31,true,'2026-05-02T18:15:00.000Z'),
('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111101','James O.','Came alone on a Tuesday with a book and left with the sense that Harare still has rooms for quiet. The garden table near the fountain is magic. Staff treated a solo diner like a celebration, not an afterthought.',22,true,'2026-06-18T13:00:00.000Z'),
('22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111102','Chipo N.','My ritual now: flat white, corner window, twenty minutes before emails. The pour-over tastes like someone measured the water with care. On hard weeks, Ginkgo is the only place that asks nothing of me except to sit still.',58,true,'2026-02-20T07:55:00.000Z'),
('22222222-2222-4222-8222-222222222205','11111111-1111-4111-8111-111111111102','Farai D.','Saturday almond croissant, shared with my sister who flew in from Joburg. We stayed too long. Soft morning light, soft music, and the kind of conversation that only happens when the coffee is right.',39,true,'2026-04-11T10:20:00.000Z'),
('22222222-2222-4222-8222-222222222206','11111111-1111-4111-8111-111111111103','Aisha B.','I watched elephants cross the Zambezi from our deck and cried without knowing why. Soft light on the water, hippos arguing somewhere in the reeds, and the first silence I had felt in years. We almost skipped the Falls themselves. The river was enough.',86,true,'2026-01-22T17:30:00.000Z'),
('22222222-2222-4222-8222-222222222207','11111111-1111-4111-8111-111111111103','Michael T.','Anniversary trip. Private canoe at first light â€” mist, kingfishers, my wife laughing when I nearly tipped us. Dinner that night felt ceremonial somehow. I still hear the river when I close my eyes at my desk in Harare.',64,true,'2026-04-05T06:45:00.000Z'),
('22222222-2222-4222-8222-222222222208','11111111-1111-4111-8111-111111111103','Nokuthula S.','Left my laptop closed for three days and survived. Soft evenings on the deck, good wine, nothing to prove. This lodge taught me that luxury is mostly permission to be still.',51,true,'2026-06-28T20:10:00.000Z'),
('22222222-2222-4222-8222-222222222209','11111111-1111-4111-8111-111111111104','Tariro H.','Mist in the pines at 6am, coffee on the verandah, and a book I finally finished. We walked until our legs ached and still did not want to leave. Nyanga feels like Zimbabwe remembering itself.',43,true,'2026-05-17T08:00:00.000Z'),
('22222222-2222-4222-8222-222222222210','11111111-1111-4111-8111-111111111104','David L.','Brought the dogs. Fireplace every night. Soft rain on the roof while we cooked pasta with market vegetables from Juliasdale. The gravel road was worth every bump.',37,true,'2026-07-02T21:15:00.000Z'),
('22222222-2222-4222-8222-222222222211','11111111-1111-4111-8111-111111111105','Blessing C.','Ten of us for my fortieth. Soft light on the lake at sunset and someone put on old Chimurenga soft enough to talk over. We swam in a cove so quiet I forgot birthdays were supposed to be loud.',72,true,'2026-03-30T18:50:00.000Z'),
('22222222-2222-4222-8222-222222222212','11111111-1111-4111-8111-111111111105','Kudzai P.','Caught nothing worth keeping and still called it the best weekend of the year. The upper deck at golden hour â€” copper water, cold drinks, friends who know when to be quiet.',55,true,'2026-06-09T16:25:00.000Z'),
('22222222-2222-4222-8222-222222222213','11111111-1111-4111-8111-111111111106','Thandiwe R.','Standing among the balancing rocks at dusk rearranged something in me. Soft light on granite, a guide who spoke of ancestors without performance, and a silence that felt earned. I keep the photo on my phone but the feeling does not fit in a frame.',91,true,'2026-02-08T17:00:00.000Z'),
('22222222-2222-4222-8222-222222222214','11111111-1111-4111-8111-111111111106','Peter W.','Tracked white rhino at first light and spent the afternoon doing absolutely nothing by the pool. Matobo Hills Lodge gets the balance right â€” awe in the morning, soft luxury by evening.',48,true,'2026-05-21T07:40:00.000Z'),
('22222222-2222-4222-8222-222222222215','11111111-1111-4111-8111-111111111106','Grace M.','Came for the rock art and stayed for the fire pit conversations with strangers who felt like friends by midnight. Soft wind through the hills. I will return alone next time.',33,true,'2026-07-12T22:05:00.000Z'),
('22222222-2222-4222-8222-222222222216','11111111-1111-4111-8111-111111111107','Nyasha V.','One drink became three. Soft amber light, a DJ who knew when to push and when to hold, and a night that reminded me Harare still has pulse. Walked out into Avondale air laughing with people I had just met.',61,true,'2026-04-19T01:20:00.000Z'),
('22222222-2222-4222-8222-222222222217','11111111-1111-4111-8111-111111111107','Simba J.','Birthday without a plan. Ended up at The Basement, danced until my feet hurt, and somehow it felt more honest than any dinner reservation. The smoked old fashioned is dangerous in the best way.',44,true,'2026-07-20T23:45:00.000Z'),
('22222222-2222-4222-8222-222222222218','11111111-1111-4111-8111-111111111108','Lindiwe A.','Booked a midweek massage after a brutal quarter. Soft light, eucalyptus steam, and a therapist who found every knot I had been pretending not to have. Walked back into the CBD feeling like I had borrowed someone else''s calm.',52,true,'2026-03-05T11:30:00.000Z'),
('22222222-2222-4222-8222-222222222219','11111111-1111-4111-8111-111111111108','Helen F.','Gifted myself the couple''s suite before our wedding week. Soft towels, quiet tea, city noise muted behind glass. It was the only hour that week that belonged only to us.',40,true,'2026-06-15T14:50:00.000Z')
on conflict (id) do nothing;

-- Seed homepage sections
insert into public.homepage_sections (
  id, key, title, subtitle, sort_order, enabled, place_ids
) values
(
  '33333333-3333-4333-8333-333333333301',
  'trending',
  'Trending',
  'What Zimbabwe is talking about right now',
  1,
  true,
  array[
    '11111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111105'::uuid,
    '11111111-1111-4111-8111-111111111107'::uuid
  ]
),
(
  '33333333-3333-4333-8333-333333333302',
  'new_discoveries',
  'New Discoveries',
  'Fresh finds worth your next outing',
  2,
  true,
  array[
    '11111111-1111-4111-8111-111111111102'::uuid,
    '11111111-1111-4111-8111-111111111104'::uuid,
    '11111111-1111-4111-8111-111111111107'::uuid
  ]
),
(
  '33333333-3333-4333-8333-333333333303',
  'panora_picks',
  'Panora Picks',
  'Handpicked by the Panora team',
  3,
  true,
  array[
    '11111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111102'::uuid,
    '11111111-1111-4111-8111-111111111106'::uuid,
    '11111111-1111-4111-8111-111111111108'::uuid
  ]
),
(
  '33333333-3333-4333-8333-333333333304',
  'weekend_escape',
  'Weekend Escape',
  'Leave the city. Come back lighter.',
  4,
  true,
  array[
    '11111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111104'::uuid,
    '11111111-1111-4111-8111-111111111105'::uuid
  ]
),
(
  '33333333-3333-4333-8333-333333333305',
  'editors_choice',
  'Editor''s Choice',
  'Places we would book again tomorrow',
  5,
  true,
  array[
    '11111111-1111-4111-8111-111111111101'::uuid,
    '11111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111106'::uuid,
    '11111111-1111-4111-8111-111111111108'::uuid
  ]
)
on conflict (key) do nothing;


-- #############################################################################
-- SECTION: 002_mvp_gaps.sql
-- Source: supabase/migrations/002_mvp_gaps.sql
-- #############################################################################

-- MVP gap fills: feeling on stories, place verifications, enquiries
-- Safe to run after 001_panora_go.sql

-- ---------------------------------------------------------------------------
-- Experience stories / comments mood
-- ---------------------------------------------------------------------------
alter table public.experience_stories
  add column if not exists feeling text;

comment on column public.experience_stories.feeling is
  'Optional one-word mood from the guest (e.g. peaceful, awestruck). Mapped as comments.feeling in product language.';

-- ---------------------------------------------------------------------------
-- Place verification badge keys
-- ---------------------------------------------------------------------------
alter table public.places
  add column if not exists verifications jsonb not null default '[]'::jsonb;

comment on column public.places.verifications is
  'Array of verification keys: photos_verified, accurate_pricing, family_friendly, solar_power, borehole_water, starlink.';

create index if not exists places_verifications_gin_idx
  on public.places using gin (verifications);

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  place_id uuid references public.places (id) on delete set null,
  place_name text,
  preferred_date text,
  guests text,
  phone text,
  email text,
  budget text,
  special_request text,
  channel text check (
    channel is null
    or channel in ('whatsapp', 'email', 'call', 'web')
  ),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'closed', 'spam')
  ),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

create index if not exists enquiries_place_id_idx
  on public.enquiries (place_id);

create index if not exists enquiries_code_idx
  on public.enquiries (code);

alter table public.enquiries enable row level security;

drop policy if exists "Public can insert enquiries" on public.enquiries;
create policy "Public can insert enquiries"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries"
  on public.enquiries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries"
  on public.enquiries
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- #############################################################################
-- SECTION: 003_bookings.sql
-- Source: supabase/migrations/003_bookings.sql
-- #############################################################################

-- Bookings (concierge enquiries with customer numbers, QR, tickets)
-- Safe to run after 002_mvp_gaps.sql

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_number text not null unique,
  customer_name text not null,
  email text,
  phone text,
  venue_id uuid references public.places (id) on delete set null,
  venue_name text not null,
  venue_address text,
  preferred_date text,
  adults integer not null default 1 check (adults >= 0 and adults <= 99),
  children integer not null default 0 check (children >= 0 and children <= 99),
  occasion text,
  budget text,
  special_request text,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'unavailable', 'cancelled', 'completed')
  ),
  qr_code_url text,
  ticket_pdf_url text,
  qr_payload jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

create index if not exists bookings_status_idx
  on public.bookings (status);

create index if not exists bookings_venue_id_idx
  on public.bookings (venue_id);

create index if not exists bookings_customer_number_idx
  on public.bookings (customer_number);

alter table public.bookings enable row level security;

drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
  on public.bookings
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
  on public.bookings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage bucket for QR codes / tickets (create in dashboard if missing)
-- insert into storage.buckets (id, name, public) values ('booking-assets', 'booking-assets', true)
-- on conflict do nothing;


-- #############################################################################
-- SECTION: 004_concierge.sql
-- Source: supabase/migrations/004_concierge.sql
-- #############################################################################

-- Concierge booking refinements (safe after 003_bookings.sql)
-- Run before 005_command_center.sql
-- Customer name split, sequential REF-######, verify RPC, storage, optional video_url

-- ---------------------------------------------------------------------------
-- Bookings: name split + support contact snapshot
-- ---------------------------------------------------------------------------
alter table public.bookings
  add column if not exists customer_first_name text;

alter table public.bookings
  add column if not exists customer_surname text;

alter table public.bookings
  add column if not exists verified_at timestamptz;

comment on column public.bookings.customer_first_name is
  'Guest given name collected on enquire form.';

comment on column public.bookings.customer_surname is
  'Guest family name collected on enquire form.';

comment on column public.bookings.verified_at is
  'Set when /verify/{customerNumber} is opened successfully.';

-- Backfill name parts from customer_name where missing
update public.bookings
set
  customer_first_name = coalesce(
    customer_first_name,
    nullif(split_part(customer_name, ' ', 1), '')
  ),
  customer_surname = coalesce(
    customer_surname,
    nullif(trim(substring(customer_name from position(' ' in customer_name))), '')
  )
where customer_first_name is null or customer_surname is null;

-- ---------------------------------------------------------------------------
-- Sequential booking references: REF-000127
-- ---------------------------------------------------------------------------
create sequence if not exists public.booking_reference_seq
  as bigint
  start with 127
  increment by 1
  minvalue 1
  no maxvalue
  cache 1;

create or replace function public.next_booking_reference()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('public.booking_reference_seq');
  return 'REF-' || lpad(n::text, 6, '0');
end;
$$;

grant execute on function public.next_booking_reference() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Public verify lookup (limited exposure by exact customer number)
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_by_customer_number(p_customer_number text)
returns table (
  id uuid,
  booking_reference text,
  customer_number text,
  customer_name text,
  customer_first_name text,
  customer_surname text,
  venue_name text,
  venue_address text,
  preferred_date text,
  adults integer,
  children integer,
  occasion text,
  status text,
  created_at timestamptz,
  verified_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id,
    b.booking_reference,
    b.customer_number,
    b.customer_name,
    b.customer_first_name,
    b.customer_surname,
    b.venue_name,
    b.venue_address,
    b.preferred_date,
    b.adults,
    b.children,
    b.occasion,
    b.status,
    b.created_at,
    b.verified_at
  from public.bookings b
  where upper(b.customer_number) = upper(trim(p_customer_number))
     or upper(b.booking_reference) = upper(trim(p_customer_number))
  limit 1;
end;
$$;

grant execute on function public.get_booking_by_customer_number(text) to anon, authenticated, service_role;

create or replace function public.mark_booking_verified(p_customer_number text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
  code text := upper(trim(p_customer_number));
begin
  update public.bookings
  set
    verified_at = coalesce(verified_at, now()),
    updated_at = now(),
    history = coalesce(history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'at', now(),
        'event', 'verified',
        'status', status
      )
    )
  where upper(customer_number) = code
     or upper(booking_reference) = code
  returning verified_at into ts;

  return ts;
end;
$$;

grant execute on function public.mark_booking_verified(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Optional venue video URL
-- ---------------------------------------------------------------------------
alter table public.places
  add column if not exists video_url text;

comment on column public.places.video_url is
  'Optional venue video (mp4 or embeddable URL) shown below the hero.';

-- ---------------------------------------------------------------------------
-- Storage bucket for QR / ticket assets (idempotent)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('booking-assets', 'booking-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public read booking assets" on storage.objects;
create policy "Public read booking assets"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'booking-assets');

drop policy if exists "Service upload booking assets" on storage.objects;
create policy "Service upload booking assets"
  on storage.objects for insert
  to authenticated, service_role
  with check (bucket_id = 'booking-assets');

drop policy if exists "Service update booking assets" on storage.objects;
create policy "Service update booking assets"
  on storage.objects for update
  to authenticated, service_role
  using (bucket_id = 'booking-assets')
  with check (bucket_id = 'booking-assets');


-- #############################################################################
-- SECTION: 005_command_center.sql
-- Source: supabase/migrations/005_command_center.sql
-- #############################################################################

-- Panora Command Center schema extensions
-- Safe to run after 004_concierge.sql (and earlier migrations 001â€“003)
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
  'Soft-archive â€” hidden from public listings but retained for admin.';

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
-- Place submissions (public Add Your Place â†’ admin approval)
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
-- Create in Dashboard â†’ Storage if insert fails due to permissions.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;


-- #############################################################################
-- SECTION: 006_security_guards.sql
-- Source: supabase/migrations/006_security_guards.sql
-- #############################################################################

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


-- #############################################################################
-- SECTION: 007_realtime_publications.sql
-- Source: supabase/migrations/007_realtime_publications.sql
-- #############################################################################

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


-- #############################################################################
-- SECTION: 008_admin_credentials.sql
-- Source: supabase/migrations/008_admin_credentials.sql
-- #############################################################################

-- Admin credentials metadata (password itself stays in Supabase Auth)
-- Safe after 007_realtime_publications.sql
--
-- Does NOT store password hashes or plaintext. Use Auth Admin API /
-- Dashboard to set passwords; this table tracks roster + password ops.

create table if not exists public.admin_credentials (
  -- FK to profiles (also auth.users via profiles.id) so PostgREST can embed.
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null default '',
  is_active boolean not null default true,
  must_reset boolean not null default false,
  password_updated_at timestamptz,
  password_set_by uuid references public.profiles (id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_credentials is
  'Admin roster + password lifecycle metadata. Passwords live in Supabase Auth only.';

comment on column public.admin_credentials.password_updated_at is
  'When the password was last set via Command Center or Auth Admin API (not Auth login).';

create index if not exists admin_credentials_active_idx
  on public.admin_credentials (is_active)
  where is_active = true;

drop trigger if exists admin_credentials_set_updated_at on public.admin_credentials;
create trigger admin_credentials_set_updated_at
  before update on public.admin_credentials
  for each row execute function public.set_updated_at();

alter table public.admin_credentials enable row level security;

drop policy if exists "Admins manage admin_credentials" on public.admin_credentials;
create policy "Admins manage admin_credentials"
  on public.admin_credentials
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed from existing admin profiles (idempotent)
insert into public.admin_credentials (user_id, email, is_active)
select
  p.id,
  coalesce(nullif(trim(p.email), ''), ''),
  p.role = 'admin'
from public.profiles p
where p.role in ('admin', 'editor', 'viewer')
on conflict (user_id) do update
  set
    email = coalesce(nullif(trim(excluded.email), ''), public.admin_credentials.email),
    is_active = excluded.is_active,
    updated_at = now();


-- #############################################################################
-- SECTION: 009_verify_lookup.sql
-- Source: supabase/migrations/009_verify_lookup.sql
-- #############################################################################

-- Allow public verify lookup by customer number OR booking reference.
create or replace function public.get_booking_by_customer_number(p_customer_number text)
returns table (
  id uuid,
  booking_reference text,
  customer_number text,
  customer_name text,
  customer_first_name text,
  customer_surname text,
  venue_name text,
  venue_address text,
  preferred_date text,
  adults integer,
  children integer,
  occasion text,
  status text,
  created_at timestamptz,
  verified_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code text := upper(trim(p_customer_number));
begin
  return query
  select
    b.id,
    b.booking_reference,
    b.customer_number,
    b.customer_name,
    b.customer_first_name,
    b.customer_surname,
    b.venue_name,
    b.venue_address,
    b.preferred_date,
    b.adults,
    b.children,
    b.occasion,
    b.status,
    b.created_at,
    b.verified_at
  from public.bookings b
  where upper(b.customer_number) = code
     or upper(b.booking_reference) = code
  limit 1;
end;
$$;

grant execute on function public.get_booking_by_customer_number(text) to anon, authenticated, service_role;

create or replace function public.mark_booking_verified(p_customer_number text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
  code text := upper(trim(p_customer_number));
begin
  update public.bookings
  set
    verified_at = coalesce(verified_at, now()),
    updated_at = now(),
    history = coalesce(history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'at', now(),
        'event', 'verified',
        'status', status
      )
    )
  where upper(customer_number) = code
     or upper(booking_reference) = code
  returning verified_at into ts;

  return ts;
end;
$$;

grant execute on function public.mark_booking_verified(text) to anon, authenticated, service_role;


-- #############################################################################
-- SECTION: 010_realtime_places_replica.sql
-- Source: supabase/migrations/010_realtime_places_replica.sql
-- #############################################################################

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

