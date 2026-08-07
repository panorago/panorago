# Place image attributions

Local copies of openly licensed photographs used for Panora Go seed/hero imagery.
Do **not** replace these with scraped Google Maps / Google Images tiles.

Redistribution: files below are from Wikimedia Commons under CC BY / CC BY-SA or public domain.
Keep attribution visible in this file; CC BY-SA works require share-alike for derivatives.

## Chinhoyi Caves

| File | Author | License | Commons |
|------|--------|---------|---------|
| `chinhoyi-sleeping-pool-01.jpg` | Suesen | CC BY-SA 3.0 | [Sleeping Pool, Chinhoyi Caves, Zimbabwe.JPG](https://commons.wikimedia.org/wiki/File:Sleeping_Pool,_Chinhoyi_Caves,_Zimbabwe.JPG) |
| `chinhoyi-sleeping-pool-02.jpg` | Suesen | CC BY-SA 3.0 | [Sleeping Pool, Chinhoyi caves, Zimbabwe.JPG](https://commons.wikimedia.org/wiki/File:Sleeping_Pool,_Chinhoyi_caves,_Zimbabwe.JPG) |
| `chinhoyi-caves-interior.jpg` | Suesen | CC BY-SA 3.0 | [Chinhoyi caves, Zimbabwe.JPG](https://commons.wikimedia.org/wiki/File:Chinhoyi_caves,_Zimbabwe.JPG) |
| `chinhoyi-caves-admin.jpg` | Suesen | CC BY-SA 3.0 | [Chinhoyi Caves Administration office, Zimbabwe.JPG](https://commons.wikimedia.org/wiki/File:Chinhoyi_Caves_Administration_office,_Zimbabwe.JPG) |
| `chinhoyi-caves-wla2019.jpg` | MichaelknowC | CC BY-SA 4.0 | [Chinhoi caves.jpg](https://commons.wikimedia.org/wiki/File:Chinhoi_caves.jpg) |

## Victoria Falls

| File | Author | License | Commons |
|------|--------|---------|---------|
| `victoria-falls-main.jpg` | Diego Delso | CC BY-SA 4.0 | [Cataratas Victoria … DD 05.jpg](https://commons.wikimedia.org/wiki/File:Cataratas_Victoria,_Zambia-Zimbabue,_2018-07-27,_DD_05.jpg) |
| `victoria-falls-zambezi.jpg` | Bernard Gagnon | CC BY-SA 4.0 | [Victoria Falls, Zimbabwe 01.jpg](https://commons.wikimedia.org/wiki/File:Victoria_Falls,_Zimbabwe_01.jpg) |

## Lake Kariba

| File | Author | License | Commons |
|------|--------|---------|---------|
| `lake-kariba-shore.jpg` | Suesen (timestamp cropped) | CC BY-SA 3.0 | [Kariba, Zimbabwe 05.JPG](https://commons.wikimedia.org/wiki/File:Kariba,_Zimbabwe_05.JPG) |
| `lake-kariba-lodge-view.jpg` | Suesen (timestamp cropped) | CC BY-SA 3.0 | [Kariba, Zimbabwe 04.JPG](https://commons.wikimedia.org/wiki/File:Kariba,_Zimbabwe_04.JPG) |
| `lake-kariba-kapenta.jpg` | Zimrh | CC BY-SA 3.0 | [Kariba Kapenta Rig.JPG](https://commons.wikimedia.org/wiki/File:Kariba_Kapenta_Rig.JPG) |
| `lake-kariba-iss.jpg` | ISS Expedition 4 Crew / NASA | Public domain | [Lake Kariba.jpg](https://commons.wikimedia.org/wiki/File:Lake_Kariba.jpg) |

## Which seed places use what

| Place slug | Imagery type |
|------------|--------------|
| `sleeping-pool-lookout` | Real Sleeping Pool / Chinhoyi Caves photos |
| `caves-edge-lodge` | Caves park **area context** (lodge building not freely licensed) |
| `copper-bean-coffee` | Chinhoyi Caves **area context** — admin should upload café photos |
| `mandara-kitchen` | Chinhoyi Caves **area context** — admin should upload venue photos |
| `mlichi-farm-stay` | Mashonaland West / Caves park **area context** — farm photos via Admin |
| `baobab-braai-garden` | Chinhoyi Caves **area context** — braai garden photos via Admin |
| `kariba-houseboat-serenity` | Real Lake Kariba shoreline / kapenta / ISS |
| `victoria-falls-river-lodge` | Real Victoria Falls landmark photos |

## Admin note

For cafés, restaurants, lodges, and farm stays **without** freely redistributable venue photos:
upload owner-supplied images in **Admin → place form / Media Library**. Do not invent “Google Maps downloads.”

## Refresh / Google Places path

```bash
# Re-download Wikimedia seed set
node scripts/download-place-images.mjs

# Optional: official Google Places Photo API (key required, show attributions in UI)
node scripts/fetch-google-place-photos.mjs
node scripts/fetch-google-place-photos.mjs --download
```

Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `GOOGLE_MAPS_API_KEY` with Places API + Place Photos enabled.
No key was available in this environment at seed time; Wikimedia Commons was used instead.
