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
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

create policy "profiles_admin_delete"
  on public.profiles for delete
  using (public.is_admin());

-- Places: public read published; admin full access
create policy "places_public_read_published"
  on public.places for select
  using (published = true or public.is_admin());

create policy "places_admin_insert"
  on public.places for insert
  with check (public.is_admin());

create policy "places_admin_update"
  on public.places for update
  using (public.is_admin());

create policy "places_admin_delete"
  on public.places for delete
  using (public.is_admin());

-- Place images
create policy "place_images_public_read"
  on public.place_images for select
  using (
    exists (
      select 1 from public.places p
      where p.id = place_id and (p.published = true or public.is_admin())
    )
  );

create policy "place_images_admin_all"
  on public.place_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- Experience stories: public read published; admin write
create policy "stories_public_read_published"
  on public.experience_stories for select
  using (published = true or public.is_admin());

create policy "stories_admin_insert"
  on public.experience_stories for insert
  with check (public.is_admin());

create policy "stories_admin_update"
  on public.experience_stories for update
  using (public.is_admin());

create policy "stories_admin_delete"
  on public.experience_stories for delete
  using (public.is_admin());

-- Story likes: anyone can insert (visitor key); public can read; admin delete
create policy "story_likes_public_select"
  on public.story_likes for select
  using (true);

create policy "story_likes_public_insert"
  on public.story_likes for insert
  with check (true);

create policy "story_likes_admin_delete"
  on public.story_likes for delete
  using (public.is_admin());

-- Homepage sections: public read enabled; admin full
create policy "homepage_sections_public_read"
  on public.homepage_sections for select
  using (enabled = true or public.is_admin());

create policy "homepage_sections_admin_all"
  on public.homepage_sections for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket policies for `place-images`
-- Create the bucket in Supabase Dashboard (Storage → New bucket → place-images)
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
  'Hidden beneath a canopy of old jacarandas, Amanzi unfolds like a whispered invitation. Soft light pools across white linen as the last heat of the day dissolves into the garden. You arrive not for a meal, but for the pause between conversations — the clink of glass, the slow pour of a Cape blend, the scent of woodsmoke drifting from the open kitchen. Plates arrive as stories: charcoal-grilled bream with a quiet confidence, garden herbs that taste like someone actually grew them. The evening stretches. Nobody rushes you. Outside the gate, Harare keeps moving; inside, time softens into something you will remember for years.',
  'Book the garden table near the fountain if you want privacy without feeling banished. Ask for the seasonal tasting menu on Fridays — it changes with what the farms deliver. Arrive thirty minutes before sunset; the light through the jacarandas is the real aperitif. Cash and Visa both work, but USD cash still gets the smoother smile. Parking fills early on weekends — use the Belgravia side entrance.',
  '{"goldenHour":"Garden tables under jacarandas from 5:30–6:30pm","bestTime":"Thursday–Saturday dinner; weekday lunch for quieter tables","dressVibe":"Smart casual — linen, clean shoes, no sportswear","noiseLevel":"Soft conversation; music stays under the chatter","perfectFor":["Anniversaries","First impressions","Quiet celebrations"],"paymentMethods":["USD cash","Visa","EcoCash"],"averageSpend":"$25–40 pp","openingHours":"Tue–Sun 12:00–22:00; closed Mondays"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"outdoorSeating":true,"wheelchairAccess":true,"kidFriendly":false,"petFriendly":false,"music":true,"photography":true,"phoneSignal":"strong","roadCondition":"excellent","power":true,"solar":true}'::jsonb,
  '{"whatsapp":"+263772123456","phone":"+263242794567","email":"reservations@amanzi.co.zw","website":"https://amanzi.co.zw","instagram":"@amanzirestaurant","googleMapsUrl":"https://maps.google.com/?q=Amanzi+Restaurant+Harare"}'::jsonb,
  '$25–40 pp',
  4.2,
  true,
  true,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80'
  ],
  'Amanzi Restaurant Harare — Garden Fine Dining | Panora Go',
  'Discover Amanzi in Belgravia, Harare — garden dining under jacarandas with seasonal plates, soft light, and date-night atmosphere. Insider tips from Panora Go.',
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
  'Morning at Ginkgo begins before the rush — the grinders warm, the first pour-over blooms, steam curls toward high windows that catch Borrowdale light. You sit with a flat white that tastes like someone cared about the milk temperature. Laptop lids open. Soft conversations about nothing urgent. The pastry case holds croissants that flake the way they should, and a lemon tart that arrives looking almost too composed. This is not a pit stop. It is the hour you reclaim before the city asks for everything else. Stay long enough and the room becomes a quiet membership of people who know how to start a day properly.',
  'The corner table by the east window is the prize — arrive before 8:15am on weekdays. Their single-origin filter rotates monthly; ask what is on the Chemex. Card machines can be slow after load shedding — keep a few USD notes ready. The almond croissant sells out by 10am on Saturdays. Parking is easier if you enter from the Brooke side rather than the main road.',
  '{"goldenHour":"Morning light through east windows until ~9:30am","bestTime":"Weekday mornings 7:30–10:00; Saturday brunch before 11","dressVibe":"Relaxed — jeans, sneakers, work-from-café energy","noiseLevel":"Gentle hum; good for reading and light calls","perfectFor":["Solo mornings","Catch-ups","Remote work stretches"],"paymentMethods":["USD cash","Visa","EcoCash","OneMoney"],"averageSpend":"$6–12 pp","openingHours":"Mon–Sun 07:00–17:00"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"outdoorSeating":true,"wheelchairAccess":true,"kidFriendly":true,"power":true,"solar":true,"phoneSignal":"strong","roadCondition":"excellent","photography":true}'::jsonb,
  '{"whatsapp":"+263773456789","phone":"+263242885120","email":"hello@ginkgocoffee.co.zw","instagram":"@ginkgocoffeehouse","facebook":"Ginkgo Coffee House Harare","googleMapsUrl":"https://maps.google.com/?q=Ginkgo+Coffee+Borrowdale+Harare"}'::jsonb,
  '$6–12 pp',
  12.5,
  true,
  true,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73839982?w=1600&q=80'
  ],
  'Ginkgo Coffee House Borrowdale — Harare Café Ritual | Panora Go',
  'Find Ginkgo Coffee House in Borrowdale Brooke — pour-overs, quiet tables, and the morning light Harare regulars protect. Panora Go insider notes included.',
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
  'The Zambezi does not perform for you. It simply moves — wide, bronze, endlessly patient — while your lodge deck holds the silence between hippo calls. Soft light finds the water first, then the canvas of your suite, then the coffee tray left without a knock. Days here are measured in river drifts and the hush before dinner, when the sky turns the colour of apricot jam. You dress lightly. You speak less. Somewhere beyond the reeds, elephants cross as if the land still belongs to them. Victoria Falls is twenty minutes away; the feeling of having arrived somewhere older than tourism is right here, on this bank, with nothing urgent left to prove.',
  'Request a river-facing suite — the difference is not subtle. Golden hour from the main deck is non-negotiable; bring a light shawl even in summer. Book the private canoe at first light rather than midday. Transfers from Vic Falls town take ~25 minutes on a fair road. Starlink is reliable for urgent work; still, leave the laptop closed if you can. Ask the lodge about the seasonal migration sightings before you plan game drives.',
  '{"goldenHour":"River deck facing west — 5:15–6:15pm depending on season","bestTime":"May–October for clear skies; November for dramatic storms","dressVibe":"Resort casual — linen, sandals, something nicer for dinner","noiseLevel":"Nature soundtrack; lodge keeps evenings low-key","perfectFor":["Couples","Milestone trips","Digital detox weekends"],"paymentMethods":["USD cash","Visa","Mastercard"],"averageSpend":"From $450 / night","openingHours":"Lodge reception 06:00–22:00; dining by reservation"}'::jsonb,
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
  'Victoria Falls River Lodge — Zambezi Escape | Panora Go',
  'Stay on the Zambezi at Victoria Falls River Lodge — river suites, golden hour decks, and quiet luxury minutes from the Falls. Curated by Panora Go.',
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
  'Mist hangs between the pines like a held breath. Nyanga Pine Cottage sits off a gravel spur where the air turns cool enough to want a sweater in July and a fireplace in every season that matters. You wake to birds you cannot name and coffee that tastes better because nobody is waiting on you. Days blur into walks along trout streams, long lunches on the verandah, and the soft decision to stay one more night. Soft light filters through needles onto stone floors. The city feels theoretical. This is the version of Zimbabwe that lives in the highlands — green, quiet, slightly forgotten — and that is exactly why you come.',
  'The last 4km is gravel — a regular sedan manages it carefully in dry weather; 4x4 preferred after rain. Stock up in Rusape or Juliasdale; the cottage kitchen is fully equipped but shops close early. Bring cash for the caretaker tip and roadside avocado sellers. Book Friday–Sunday for peak misty mornings. The fireplace wood is provided — ask for extra if nights look cold. Starlink works from the main lounge; bedroom signal is weaker.',
  '{"goldenHour":"Verandah facing the valley — late afternoon mist glow","bestTime":"April–August for crisp air; September for wildflowers","dressVibe":"Layers — mornings cold, afternoons mild","noiseLevel":"Near silence; only wind and birds","perfectFor":["Couples","Writing retreats","Slow weekends"],"paymentMethods":["USD cash","EcoCash","Bank transfer"],"averageSpend":"From $80 / night","openingHours":"Self-catering; check-in from 14:00, check-out by 10:00"}'::jsonb,
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
  'Nyanga Pine Cottage — Highland Weekend Escape | Panora Go',
  'Escape to Nyanga Pine Cottage in Troutbeck Valley — misty pines, fireplace nights, and quiet highland air. Panora Go weekend guide and booking notes.',
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
  'On Kariba, the horizon is the only clock that matters. Houseboat Serenity drifts into coves where the water turns copper and the hills go black against the sky. Soft light spills across the upper deck as someone opens a cold drink and nobody checks their phone. You fish, or you pretend to. You swim when the captain says it is safe. At dusk the lake holds its breath and the first stars arrive early. This is celebration without confetti — birthdays, reunions, the decision to finally take a long weekend. The boat rocks gently. Conversations deepen. Somewhere a fish eagle calls, and you understand why people keep coming back to this inland sea.',
  'Charter for a minimum of two nights if you want the full rhythm — day trips feel rushed. Confirm fuel and ice inclusions before you board. Soft drinks and ice sell out at Andora Harbour early on Fridays; stock in town first. Sunset is best from the upper deck facing west toward the Matusadona silhouette. Bring reef-safe sunscreen and a light jacket for night breezes. Card payments on the harbour can be unreliable — USD cash rules.',
  '{"goldenHour":"Upper deck west-facing — 5:00–6:00pm most months","bestTime":"April–October for calmer water; avoid peak wind weeks in Aug","dressVibe":"Swimwear by day, easy layers by night","noiseLevel":"Generator hum at night; otherwise lake quiet","perfectFor":["Groups of 6–10","Birthdays","Friend reunions"],"paymentMethods":["USD cash","Bank transfer"],"averageSpend":"From $180 / night (whole boat)","openingHours":"Charters by arrangement; boarding from 14:00"}'::jsonb,
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
  'Houseboat Serenity Kariba — Lake Charter Escape | Panora Go',
  'Charter Houseboat Serenity on Lake Kariba — copper sunsets, cove swimming, and celebration weekends on the water. Insider tips from Panora Go.',
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
  'The granite balancing rocks of Matobo do not need explanation. They simply stand — ancient, improbable, catching soft light that turns pink then gold then violet. Matobo Hills Lodge sits among them without competing. You walk at dawn with a guide who speaks of rock art and rhinos in the same quiet breath. Afternoons dissolve into shade and cold drinks. Evenings bring a fire pit and the sense that civilisation is far enough away to forget its noise. This is not a checklist visit. It is a place that rearranges your sense of scale — of time, of landscape, of what a weekend can hold when you stop trying to fill every hour.',
  'Stay at least two nights — one day is not enough for both the cultural and wildlife circuits. Morning game drives beat afternoon heat for rhino tracking. Bring closed shoes for granite scrambling. The lodge can arrange a private rock-art walk with a knowledgeable local guide — worth every dollar. Bulawayo is about 40 minutes; stock snacks before you leave town. Evenings get cool; pack a fleece year-round.',
  '{"goldenHour":"Balancing rocks viewpoint behind the lodge — 5:20–6:10pm","bestTime":"May–September for wildlife and clear skies","dressVibe":"Practical chic — khaki, linen, sturdy shoes","noiseLevel":"Very quiet; lodge evenings around the fire","perfectFor":["Thoughtful travellers","Photography","Cultural weekends"],"paymentMethods":["USD cash","Visa","Bank transfer"],"averageSpend":"From $220 / night","openingHours":"Lodge open year-round; activities by booking"}'::jsonb,
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
  'Matobo Hills Lodge — Granite & Quiet Luxury | Panora Go',
  'Experience Matobo Hills Lodge near Bulawayo — balancing rocks, rhino walks, and fire-pit evenings in ancient granite country. Curated by Panora Go.',
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
  'You hear The Basement before you see it — a low bassline leaking up the stairs, laughter already mid-sentence. Soft light, amber and intentional, finds the edges of faces and leaves the rest to mystery. This is Harare after dark without the hard sell: good cocktails, a DJ who reads the room, and a crowd that dresses like they meant to be seen. You order something with citrus and smoke. Someone you know appears. The night expands. You came for one drink and stayed for the feeling that the city still knows how to gather. When you leave, the cool air on Avondale Road feels like a soft landing.',
  'Fridays after 10pm are peak — arrive by 9 if you want a booth. The signature smoked old fashioned is worth the wait. Cover charge appears on big nights; keep USD cash for the door. Security is solid; still, park in the lit Avondale lot. Music volume climbs after midnight — great for dancing, less ideal for deep conversation. Dress code is unspoken but real: look like you tried.',
  '{"goldenHour":"Not a daylight spot — golden hour is 21:00–22:30 soft start","bestTime":"Friday and Saturday from 21:00; Thursday for locals'' night","dressVibe":"Smart nightlife — no flip-flops, no sports kits","noiseLevel":"Loud after 23:00; earlier hours are conversational","perfectFor":["Birthday groups","Date nights that start late","Dancing"],"paymentMethods":["USD cash","Visa","EcoCash"],"averageSpend":"$15–30 pp","openingHours":"Thu–Sat 19:00–02:00; occasional Wed specials"}'::jsonb,
  '{"parking":true,"security":true,"music":true,"photography":true,"power":true,"phoneSignal":"strong","roadCondition":"excellent"}'::jsonb,
  '{"whatsapp":"+263776667788","phone":"+263242334455","email":"events@thebasementhre.com","instagram":"@thebasementhre","facebook":"The Basement Harare","tiktok":"@thebasementhre","googleMapsUrl":"https://maps.google.com/?q=Avondale+Shopping+Centre+Harare"}'::jsonb,
  '$15–30 pp',
  3.8,
  true,
  true,
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1600&q=80',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1600&q=80'
  ],
  'The Basement Harare — Avondale Nightlife | Panora Go',
  'Tonight at The Basement in Avondale — cocktails, amber light, and Harare nightlife with intention. Dress codes, timing, and tips from Panora Go.',
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
  'Downtown Harare disappears the moment the spa door closes. Soft light, warm stone, the faint scent of eucalyptus — Meikles Spa Sanctuary is a pocket of stillness in the middle of the CBD. You change into a robe. Your shoulders drop without being asked. Treatments here do not rush; therapists move with a calm that feels practiced over years, not shifts. Afterward you sit with herbal tea and watch the city through glass, suddenly distant. This is not indulgence for its own sake. It is the reset between a hard week and whatever comes next — a quiet luxury that locals book when they need to remember their own edges.',
  'Book midweek mornings for the quietest rooms. The deep-tissue with hot stones is the house favourite for desk-bound backs. Arrive 20 minutes early for the steam room — it is included and often overlooked. Parking under the hotel is secure and worth the fee. Couple''s suites need advance notice. Ask for the CBD noise-cancelling tip: request a room on the inner courtyard side.',
  '{"goldenHour":"Post-treatment lounge with city views — late afternoon calm","bestTime":"Tue–Thu 09:00–13:00 for fewest guests","dressVibe":"Arrive as you are; robes provided","noiseLevel":"Whisper-quiet treatment rooms","perfectFor":["Solo resets","Pre-event calm","Gift experiences"],"paymentMethods":["USD cash","Visa","Mastercard","EcoCash"],"averageSpend":"$45–90 / treatment","openingHours":"Mon–Sat 09:00–19:00; Sun 10:00–16:00"}'::jsonb,
  '{"wifi":true,"parking":true,"security":true,"wheelchairAccess":true,"swimming":true,"power":true,"solar":true,"phoneSignal":"strong","roadCondition":"excellent"}'::jsonb,
  '{"whatsapp":"+263777778889","phone":"+263242707721","email":"spa@meikles.com","website":"https://meikles.com/spa","instagram":"@meiklesspa","facebook":"Meikles Hotel Harare","googleMapsUrl":"https://maps.google.com/?q=Meikles+Hotel+Harare"}'::jsonb,
  '$45–90 / treatment',
  1.2,
  true,
  true,
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80',
  array[
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1600&q=80'
  ],
  'Meikles Spa Sanctuary Harare — CBD Wellness | Panora Go',
  'Reset at Meikles Spa Sanctuary in central Harare — quiet treatments, steam, and soft light away from the CBD rush. Book tips from Panora Go.',
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
('22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111101','Rudo K.','I brought my parents for their anniversary. Soft light on white linen, a bottle of something Cape, and my mother laughing in a way I had not heard in months. Amanzi made the city feel gentle again. I still think about the dessert — dark chocolate, a little salt, the kind of ending you do not rush.',31,true,'2026-05-02T18:15:00.000Z'),
('22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111101','James O.','Came alone on a Tuesday with a book and left with the sense that Harare still has rooms for quiet. The garden table near the fountain is magic. Staff treated a solo diner like a celebration, not an afterthought.',22,true,'2026-06-18T13:00:00.000Z'),
('22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111102','Chipo N.','My ritual now: flat white, corner window, twenty minutes before emails. The pour-over tastes like someone measured the water with care. On hard weeks, Ginkgo is the only place that asks nothing of me except to sit still.',58,true,'2026-02-20T07:55:00.000Z'),
('22222222-2222-4222-8222-222222222205','11111111-1111-4111-8111-111111111102','Farai D.','Saturday almond croissant, shared with my sister who flew in from Joburg. We stayed too long. Soft morning light, soft music, and the kind of conversation that only happens when the coffee is right.',39,true,'2026-04-11T10:20:00.000Z'),
('22222222-2222-4222-8222-222222222206','11111111-1111-4111-8111-111111111103','Aisha B.','I watched elephants cross the Zambezi from our deck and cried without knowing why. Soft light on the water, hippos arguing somewhere in the reeds, and the first silence I had felt in years. We almost skipped the Falls themselves. The river was enough.',86,true,'2026-01-22T17:30:00.000Z'),
('22222222-2222-4222-8222-222222222207','11111111-1111-4111-8111-111111111103','Michael T.','Anniversary trip. Private canoe at first light — mist, kingfishers, my wife laughing when I nearly tipped us. Dinner that night felt ceremonial somehow. I still hear the river when I close my eyes at my desk in Harare.',64,true,'2026-04-05T06:45:00.000Z'),
('22222222-2222-4222-8222-222222222208','11111111-1111-4111-8111-111111111103','Nokuthula S.','Left my laptop closed for three days and survived. Soft evenings on the deck, good wine, nothing to prove. This lodge taught me that luxury is mostly permission to be still.',51,true,'2026-06-28T20:10:00.000Z'),
('22222222-2222-4222-8222-222222222209','11111111-1111-4111-8111-111111111104','Tariro H.','Mist in the pines at 6am, coffee on the verandah, and a book I finally finished. We walked until our legs ached and still did not want to leave. Nyanga feels like Zimbabwe remembering itself.',43,true,'2026-05-17T08:00:00.000Z'),
('22222222-2222-4222-8222-222222222210','11111111-1111-4111-8111-111111111104','David L.','Brought the dogs. Fireplace every night. Soft rain on the roof while we cooked pasta with market vegetables from Juliasdale. The gravel road was worth every bump.',37,true,'2026-07-02T21:15:00.000Z'),
('22222222-2222-4222-8222-222222222211','11111111-1111-4111-8111-111111111105','Blessing C.','Ten of us for my fortieth. Soft light on the lake at sunset and someone put on old Chimurenga soft enough to talk over. We swam in a cove so quiet I forgot birthdays were supposed to be loud.',72,true,'2026-03-30T18:50:00.000Z'),
('22222222-2222-4222-8222-222222222212','11111111-1111-4111-8111-111111111105','Kudzai P.','Caught nothing worth keeping and still called it the best weekend of the year. The upper deck at golden hour — copper water, cold drinks, friends who know when to be quiet.',55,true,'2026-06-09T16:25:00.000Z'),
('22222222-2222-4222-8222-222222222213','11111111-1111-4111-8111-111111111106','Thandiwe R.','Standing among the balancing rocks at dusk rearranged something in me. Soft light on granite, a guide who spoke of ancestors without performance, and a silence that felt earned. I keep the photo on my phone but the feeling does not fit in a frame.',91,true,'2026-02-08T17:00:00.000Z'),
('22222222-2222-4222-8222-222222222214','11111111-1111-4111-8111-111111111106','Peter W.','Tracked white rhino at first light and spent the afternoon doing absolutely nothing by the pool. Matobo Hills Lodge gets the balance right — awe in the morning, soft luxury by evening.',48,true,'2026-05-21T07:40:00.000Z'),
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