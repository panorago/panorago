-- Update hero/gallery for curated Chinhoyi-area (and related) places to local
-- openly licensed landmark photos under /images/places/.
-- Safe no-op when those slugs are not present in the database.
-- See public/images/places/ATTRIBUTION.md for licenses.

update public.places
set
  hero_image = '/images/places/chinhoyi-caves-interior.jpg',
  gallery = array[
    '/images/places/chinhoyi-caves-interior.jpg',
    '/images/places/chinhoyi-sleeping-pool-01.jpg',
    '/images/places/chinhoyi-caves-admin.jpg',
    '/images/places/chinhoyi-sleeping-pool-02.jpg'
  ],
  updated_at = now()
where slug = 'caves-edge-lodge';

update public.places
set
  hero_image = '/images/places/chinhoyi-caves-admin.jpg',
  gallery = array[
    '/images/places/chinhoyi-caves-admin.jpg',
    '/images/places/chinhoyi-caves-wla2019.jpg',
    '/images/places/chinhoyi-caves-interior.jpg',
    '/images/places/chinhoyi-sleeping-pool-02.jpg'
  ],
  updated_at = now()
where slug = 'mandara-kitchen';

update public.places
set
  hero_image = '/images/places/victoria-falls-main.jpg',
  gallery = array[
    '/images/places/victoria-falls-main.jpg',
    '/images/places/victoria-falls-zambezi.jpg'
  ],
  updated_at = now()
where slug = 'victoria-falls-river-lodge';

update public.places
set
  hero_image = '/images/places/chinhoyi-caves-wla2019.jpg',
  gallery = array[
    '/images/places/chinhoyi-caves-wla2019.jpg',
    '/images/places/chinhoyi-caves-admin.jpg',
    '/images/places/chinhoyi-sleeping-pool-02.jpg',
    '/images/places/chinhoyi-caves-interior.jpg'
  ],
  updated_at = now()
where slug = 'copper-bean-coffee';

update public.places
set
  hero_image = '/images/places/chinhoyi-caves-admin.jpg',
  gallery = array[
    '/images/places/chinhoyi-caves-admin.jpg',
    '/images/places/chinhoyi-caves-interior.jpg',
    '/images/places/chinhoyi-sleeping-pool-01.jpg',
    '/images/places/chinhoyi-caves-wla2019.jpg'
  ],
  updated_at = now()
where slug = 'mlichi-farm-stay';

update public.places
set
  hero_image = '/images/places/chinhoyi-sleeping-pool-01.jpg',
  gallery = array[
    '/images/places/chinhoyi-sleeping-pool-01.jpg',
    '/images/places/chinhoyi-sleeping-pool-02.jpg',
    '/images/places/chinhoyi-caves-interior.jpg',
    '/images/places/chinhoyi-caves-wla2019.jpg'
  ],
  updated_at = now()
where slug = 'sleeping-pool-lookout';

update public.places
set
  hero_image = '/images/places/chinhoyi-caves-interior.jpg',
  gallery = array[
    '/images/places/chinhoyi-caves-interior.jpg',
    '/images/places/chinhoyi-sleeping-pool-01.jpg',
    '/images/places/chinhoyi-caves-admin.jpg',
    '/images/places/chinhoyi-caves-wla2019.jpg'
  ],
  updated_at = now()
where slug = 'baobab-braai-garden';

update public.places
set
  hero_image = '/images/places/lake-kariba-shore.jpg',
  gallery = array[
    '/images/places/lake-kariba-shore.jpg',
    '/images/places/lake-kariba-lodge-view.jpg',
    '/images/places/lake-kariba-kapenta.jpg',
    '/images/places/lake-kariba-iss.jpg'
  ],
  updated_at = now()
where slug = 'kariba-houseboat-serenity';
