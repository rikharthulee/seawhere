# 🗺️ Areas (Divisions) by Destination

Each **division** represents a logical area within a **prefecture** (Tokyo, Kyoto, Osaka, etc.).  
They are **not strict administrative wards**, but **traveller-friendly zones** used for grouping sights, excursions, and accommodation.

---

## 🎯 Why We Use Divisions

Travellers don’t plan holidays around Japanese administrative boundaries —  
they think in **recognisable neighbourhoods** (“Shinjuku”, “Gion”, “Dotonbori”) or **sightseeing clusters**.  
Divisions make content and UX intuitive by:

- Grouping nearby sights and experiences in the admin builder
- Powering “Explore nearby areas” logic on the public site
- Keeping naming consistent across itineraries, excursions, and filters
- Allowing flexible tagging even when a location spans multiple wards

---

## 🏙️ Tokyo Divisions

| Area                     | Notes                                                      |
| ------------------------ | ---------------------------------------------------------- |
| **Shinjuku**             | Major transport and nightlife hub; base for western Tokyo. |
| **Shibuya**              | Shopping, youth fashion, Hachikō, and Shibuya Crossing.    |
| **Harajuku**             | Street culture and Meiji Shrine.                           |
| **Shimokitazawa**        | Bohemian neighbourhood west of Shibuya.                    |
| **Tokyo (Station area)** | Central business district and Imperial Palace.             |
| **Asakusa**              | Sensō-ji Temple and Sumida River walks.                    |
| **Ginza**                | Upscale shopping and dining.                               |
| **Shimbashi**            | Business / salaryman nightlife zone.                       |
| **Akihabara**            | Electronics, gaming, and anime culture.                    |
| **Ueno**                 | Museums, park, and Ameyoko market.                         |
| **Kichijoji**            | Residential-cool area west of central Tokyo.               |
| **Mitaka**               | Ghibli Museum and quiet suburbs.                           |
| **Roppongi**             | Art Triangle & nightlife.                                  |
| **Meguro**               | Trendy residential and dining area.                        |
| **Tama**                 | Western Tokyo region — nature and day trips.               |

**Order rationale:** Flows roughly **west → east → outer areas**,  
mirroring how travellers typically explore Tokyo.

---

## 🏯 Kyoto Divisions

| Area                                                | Notes                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| **Kamigyo / Sakyo / Nakagyo / Shimogyo**            | Central Kyoto wards around Nijo Castle, Kyoto Station, and Downtown. |
| **Higashiyama / Gion / South–North Higashiyama**    | Main sightseeing districts (temples, Yasaka, Kiyomizu).              |
| **Ukyo / Nishikyo / West Kyoto**                    | Western side including Arashiyama.                                   |
| **Arashiyama / Sagano**                             | Scenic bamboo forests and river walks.                               |
| **Fushimi / Minami / Yamashina**                    | Southern Kyoto, sake breweries, access to Nara.                      |
| **North-East / Central / North-West / South Kyoto** | Directional groupings for outer areas.                               |

**Order rationale:** Starts at **central core**, then **east (temples)** → **west (Arashiyama)** → **outer edges**.

---

## 🏙 Osaka Divisions

| Area                                            | Notes                                                           |
| ----------------------------------------------- | --------------------------------------------------------------- |
| **Central Osaka / Kita / Chuo**                 | Main business and entertainment hubs (Umeda, Namba, Dotonbori). |
| **Nishi / Naniwa / Tennoji**                    | Key sightseeing and accommodation areas.                        |
| **Bay Area / Konohana / Minato**                | Osaka Bay and Universal Studios Japan.                          |
| **Eastern / Northern Osaka**                    | Extended metro areas, local culture.                            |
| **Sumiyoshi / Abeno / Ikuno / Hirano / others** | Residential and traditional neighbourhoods.                     |

**Order rationale:** Roughly **core → bay → east → south**, matching visitor flow through the city.

---

## 🧭 Developer Notes

- Table: `public.divisions`
- Linked via `prefecture_id` → `public.prefectures`
- Used by: `sights`, `experiences`, `accommodation`, `excursions`
- Ordering (`order_index`) follows the curated arrays in SQL migrations
- Safe to add new areas using `INSERT ... ON CONFLICT (slug)` to preserve IDs
- “Keep lists” in migrations ensure only intended divisions remain active

---
