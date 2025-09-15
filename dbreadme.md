# 🗺️ Japan Man — Schema & Routes Cheatsheet

## 🎯 What we’re building

Browse & manage **Sights, Experiences, Tours** and bundle them into **Excursions/Products** to place on **Itinerary Days**, all organized by **Region → Prefecture → Division → Destination**.

---

## 🔤 Admin UI one-liners

- 📍 **Destinations** — “Cities, towns, or areas that group sights, experiences, tours, and accommodation.”
- 🏨 **Accommodation** — “Places to stay overnight, such as hotels, ryokan, hostels, or guesthouses.”
- 🏯 **Sights** — “Static places like temples, gardens, or landmarks that visitors can go and see.”
- 🎎 **Experiences** — “Hands-on or cultural activities, like a tea ceremony, sumo try-on, or cooking class.”
- 🚌 **Tours** — “Guided outings from A→A or A→B, such as walking tours or day trips.”
- 🗺️ **Products/Excursions** — “Curated bundles of sights, experiences, and tours that make up a day plan.”
- 🍜 **Food & Drink** — “Restaurants, cafés, bars, or other places to eat and drink.”

---

## 🧱 Core tables (what they store)

- **regions** (slug) → groups prefectures
- **prefectures** (slug, region_id) → groups divisions
- **divisions** (slug, prefecture_id) → groups destinations
- **destinations** (slug, division_id, prefecture_id, status) → owns Sights/Experiences/Tours/Products
- **sights** (destination*id, status, timings, price*\*)
- **experiences** (destination_id, status, price, availability via rules/exceptions)
  - `experience_availability_rules`, `experience_exceptions`
- **tours** (destination_id, status, price, availability via rules/exceptions)
  - `tour_availability_rules`, `tour_exceptions`
- **products** (destination_id, status, body_richtext, images)
  - **product_items** (product_id, item_type, ref_id, sort_order) → links to {sight|tour|experience|food_drink|hotel}
- **accommodation / food_drink / hotels** — supporting entities
- **itineraries / itinerary_days / itinerary_day_items** — customer plan structure

---

## 🔗 Relationships

`region (1) ──< prefecture (1) ──< division (1) ──< destination (1) ──< [sight | experience | tour | product | food_drink | accommodation]`

- `product (1) ──< product_items (N)` referencing one of: sight/tour/experience/food_drink/hotel

---

## 🔐 RLS (uniform pattern)

- **Public (anon)**: read only when **published**
- **Admin (authenticated)**: **ALL** via `is_admin()`

### Example (tours)

```sql
CREATE POLICY tours_read_published ON public.tours
FOR SELECT TO public USING (status = 'published');

CREATE POLICY tours_write_admin ON public.tours
FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());
```

### Child tables tied to parent

```sql
CREATE POLICY tour_rules_read_published ON public.tour_availability_rules
FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.tours t
          WHERE t.id = tour_availability_rules.tour_id
            AND t.status='published')
);

CREATE POLICY tour_rules_write_admin ON public.tour_availability_rules
FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());
```

---

## ⚡ Helpful indexes

```sql
-- geo lookups
CREATE INDEX IF NOT EXISTS idx_dest_status_pref ON public.destinations(status, prefecture_id);
CREATE INDEX IF NOT EXISTS idx_dest_status_div  ON public.destinations(status, division_id);

-- entity → destination joins
CREATE INDEX IF NOT EXISTS idx_sights_destination_id      ON public.sights(destination_id);
CREATE INDEX IF NOT EXISTS idx_experiences_destination_id ON public.experiences(destination_id);
CREATE INDEX IF NOT EXISTS idx_tours_destination_id       ON public.tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_products_destination_id    ON public.products(destination_id);
CREATE INDEX IF NOT EXISTS idx_food_drink_destination_id  ON public.food_drink(destination_id);

-- availability tables
CREATE INDEX IF NOT EXISTS idx_exp_rules_experience_id ON public.experience_availability_rules(experience_id);
CREATE INDEX IF NOT EXISTS idx_exp_exc_experience_id   ON public.experience_exceptions(experience_id);
CREATE INDEX IF NOT EXISTS idx_tour_rules_tour_id      ON public.tour_availability_rules(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_exc_tour_id        ON public.tour_exceptions(tour_id);

-- product composition
CREATE INDEX IF NOT EXISTS idx_product_items_product_id ON public.product_items(product_id);
```

---

## 🧭 Routes (Next.js App Router → URLs)

```
/experiences                              → src/app/experiences/page.jsx
/experiences/region/[slug]                → src/app/experiences/region/[slug]/page.jsx
/experiences/prefecture/[slug]            → src/app/experiences/prefecture/[slug]/page.jsx
/experiences/division/[slug]              → src/app/experiences/division/[slug]/page.jsx
/experiences/[destinationSlug]            → src/app/experiences/[slug]/page.jsx
/experiences/[destinationSlug]/[expSlug]  → src/app/experiences/[slug]/[experience]/page.jsx
```

---

## 🔎 Common query patterns

### Experiences by **region slug**

```sql
SELECT e.*
FROM public.experiences e
JOIN public.destinations d ON d.id = e.destination_id
JOIN public.prefectures  p ON p.id = d.prefecture_id
JOIN public.regions      r ON r.id = p.region_id
WHERE r.slug = $1
  AND d.status = 'published'
  AND e.status = 'published';
```

### Experiences by **prefecture slug**

```sql
SELECT e.*
FROM public.experiences e
JOIN public.destinations d ON d.id = e.destination_id
JOIN public.prefectures  p ON p.id = d.prefecture_id
WHERE p.slug = $1
  AND d.status = 'published'
  AND e.status = 'published';
```

### Experiences by **division slug**

```sql
SELECT e.*
FROM public.experiences e
JOIN public.destinations d ON d.id = e.destination_id
JOIN public.divisions    v ON v.id = d.division_id
WHERE v.slug = $1
  AND d.status = 'published'
  AND e.status = 'published';
```

### Destination detail (for `/experiences/[destinationSlug]`)

```sql
SELECT d.*,
       (SELECT json_agg(e.*) FROM public.experiences e
         WHERE e.destination_id = d.id AND e.status='published') AS experiences
FROM public.destinations d
WHERE d.slug = $1 AND d.status='published';
```

### Product (bundle) with expanded items

```sql
SELECT p.*,
       json_agg(
         json_build_object(
           'item_type', pi.item_type,
           'ref_id',     pi.ref_id,
           'sort_order', pi.sort_order
         ) ORDER BY pi.sort_order
       ) AS items
FROM public.products p
LEFT JOIN public.product_items pi ON pi.product_id = p.id
WHERE p.slug = $1 AND p.status='published'
GROUP BY p.id;
```

---

## 🧰 Admin-friendly seed/create order

1. regions → prefectures → divisions
2. destinations (status = draft/published)
3. sights / experiences / tours / food_drink (attach `destination_id`)
4. availability rules/exceptions (for exp/tour)
5. products + product_items (attach to destination, link items)
6. itineraries (+ days + day_items referencing excursions/products etc.)

---

## 🧪 Sanity checks

```sql
-- Orphan experiences
SELECT e.id FROM public.experiences e WHERE e.destination_id IS NULL;

-- Published child with draft parent
SELECT e.id, d.slug FROM public.experiences e
JOIN public.destinations d ON d.id=e.destination_id
WHERE e.status='published' AND d.status='draft';

-- Product items pointing to missing refs
SELECT pi.* FROM public.product_items pi
LEFT JOIN public.sights s ON pi.item_type='sight' AND pi.ref_id=s.id
LEFT JOIN public.experiences x ON pi.item_type='experience' AND pi.ref_id=x.id
LEFT JOIN public.tours t ON pi.item_type='tour' AND pi.ref_id=t.id
LEFT JOIN public.food_drink f ON pi.item_type='food_drink' AND pi.ref_id=f.id
WHERE (pi.item_type='sight' AND s.id IS NULL)
    OR (pi.item_type='experience' AND x.id IS NULL)
    OR (pi.item_type='tour' AND t.id IS NULL)
    OR (pi.item_type='food_drink' AND f.id IS NULL);
```

---

## 🚧 Gotchas / decisions

- Geo derived via destination → don’t duplicate division/prefecture/region columns in experiences/tours/sights.
- Public sees only `status='published'`; admins do everything (`is_admin()`).
- Views (like `product_items_expanded`) inherit base table RLS — no direct policies.
- Excursions vs Products → DB uses **products**, UI can label them “Excursions.”
- Sights use `sight_opening_hours/_exceptions`; Experiences/Tours use `*_availability_rules/_exceptions`.
- Food & Drink is simple: type = {restaurant, bar, café, other}.
