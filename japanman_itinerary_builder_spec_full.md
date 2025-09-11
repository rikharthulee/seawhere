# JapanMan Itinerary Builder — v0.1 Spec

- Last updated: 2025‑09‑11
- Owner: Richard + Steve
- Status: Draft

---

## 0) Goals & Constraints

- **Goal:** Build an admin-only tool to assemble day-by-day Japan itineraries using drag & drop, selecting destinations, hotels, and prebuilt excursions. Customers later select entire excursions; they don’t edit inner items.
- **Platforms:** Next.js 15 (app router), Supabase (Postgres + Auth + Storage), shadcn/ui, dnd-kit.
- **Network:** Admin Auth/DB via `api.japanman.co.uk` proxy; media direct from Supabase.
- **MVP Priorities:** Speed of assembly, clear day/date mapping from flights, reusable excursion templates, cross‑city excursions supported.

---

## 1) Core Concepts

- **Destination**: City/area (Tokyo, Osaka…).
- **Itinerary**: A container for a client trip.
- **Itinerary Day**: Day N (mapped to a concrete date once flights are set); has a primary destination.
- **Day Items**: Ordered items under a day (hotel, excursion, transfer, note).
- **Excursion Template**: A reusable, immutable bundle (title, city, duration, included sights/tours, logistics). Can span multiple cities.
- **Sight**: POI record (temple, museum, neighborhood).
- **Tour**: A scheduled/operated thing (guided tour, workshop).

---

## 2) Data Model (Postgres)

Naming: `public.*`. IDs are `uuid` with `gen_random_uuid()`.

### 2.1 destinations

- `id` uuid PK
- `slug` text UNIQUE (e.g., "tokyo")
- `name` text not null
- `region` text
- `lat` numeric, `lng` numeric
- `hero_image_url` text
- `status` text check in ('active','hidden') default 'active'

### 2.2 hotels

- `id` uuid PK
- `destination_id` uuid FK → destinations
- `name` text not null
- `slug` text UNIQUE
- `address` jsonb
- `rating` numeric
- `price_band` text check in ('$','$$','$$$','$$$$')
- `images` jsonb[] or jsonb (array of urls)
- `meta` jsonb (brand, amenities)
- `status` text ('active','hidden')

### 2.3 sights

- `id` uuid PK
- `destination_id` uuid FK
- `name` text not null
- `slug` text UNIQUE
- `summary` text
- `body_richtext` jsonb (or markdown)
- `open_hours` jsonb
- `images` jsonb
- `tags` text[]
- `status` text

### 2.4 tours

- `id` uuid PK
- `destination_id` uuid FK (nullable for multi-city tours)
- `provider` text
- `name` text not null
- `duration_minutes` int
- `meeting_point` text
- `operating_days` text[] ('mon'..'sun')
- `price_from` numeric
- `images` jsonb
- `status` text

### 2.5 excursion_templates

- `id` uuid PK
- `slug` text UNIQUE
- `title` text not null
- `summary` text
- `start_destination_id` uuid FK
- `end_destination_id` uuid FK (nullable; defaults to start)
- `duration_days` int not null default 1
- `duration_minutes` int not null default 0 -- intra-day time budget
- `difficulty` text check in ('easy','moderate','intense')
- `tags` text[]
- `cover_image_url` text
- `content` jsonb -- ordered blocks; see 2.6
- `status` text check in ('draft','published') default 'draft'
- `version` int default 1
- `created_by` uuid (admin user)
- `updated_at` timestamptz

### 2.6 excursion_blocks (optional normalized child if not using a single jsonb)

- `id` uuid PK
- `excursion_id` uuid FK → excursion_templates
- `order_index` int not null
- `type` text check in ('sight','tour','meal','transfer','note','buffer')
- `ref_id` uuid nullable (→ sights/tours)
- `payload` jsonb -- time ranges, notes, internal tips, images

> **Implementation note:** We can keep blocks in a `jsonb` array inside `excursion_templates.content` for speed-of-build and use a generated column for full‑text search later.

### 2.7 itineraries

- `id` uuid PK
- `title` text
- `client_name` text
- `status` text check in ('draft','proposal','booked','archived') default 'draft'
- `start_date` date nullable -- set from flights
- `end_date` date nullable
- `nights` int generated always as (case when start_date is not null and end_date is not null then (end_date - start_date) else null end)
- `notes_internal` text
- `currency` text default 'JPY'
- `created_by` uuid
- `updated_at` timestamptz

### 2.8 itinerary_flights

- `id` uuid PK
- `itinerary_id` uuid FK
- `type` text check in ('inbound','outbound','internal')
- `carrier` text, `flight_no` text
- `depart_airport` text, `arrive_airport` text
- `depart_at` timestamptz, `arrive_at` timestamptz
- `timezone_hint` text nullable
- `notes` text

### 2.9 itinerary_days

- `id` uuid PK
- `itinerary_id` uuid FK
- `day_index` int not null -- starts at 1
- `date` date nullable -- auto-filled from start_date + (day_index-1)
- `destination_id` uuid FK not null
- `label` text nullable ("Arrival", "Free Day")
- `notes_internal` text
- `published_summary` text
- `hotel_id` uuid nullable -- primary hotel for the night (optional shortcut)
- `position` int not null default 1000 -- for DnD ordering safety

### 2.10 itinerary_day_items

- `id` uuid PK
- `itinerary_day_id` uuid FK
- `type` text check in ('hotel','excursion','transfer','note','meal')
- `ref_id` uuid nullable (→ hotels/excursions)
- `payload` jsonb (time window, pickup, custom text)
- `position` int not null default 1000

### 2.11 RLS & Roles

- `profiles` already exists with `role` enum ('admin','editor','viewer').
- RLS: admins full, editors write, viewers read. Itinerary rows owned by `created_by` or shared via `itinerary_collaborators` (small join table if needed).

---

## 3) Date Mapping Logic (Flights → Calendar Days)

1. When inbound flight is added and marked as **trip start**:
   - `itineraries.start_date = date(arrive_at, local)` (choose timezone from `timezone_hint` or arrival airport IANA).
2. Auto-fill `itinerary_days.date = start_date + (day_index-1)`.
3. Outbound flight sets `end_date` (arrive date) — this drives sanity checks: last day index matches end_date.
4. Allow manual adjustments (e.g., late arrival after midnight) to offset Day 1.

**Edge cases:**

- Overnight flights crossing midnight → flag and prompt to shift Day 1.
- Internal flights add a **transfer** day item.

---

---

## 4) Cross‑City Excursions

    •	excursion_templates include start_destination_id and optional end_destination_id.
    •	When adding an excursion to Day N:
    •	If duration_days = 1 and end_destination = start, keep the same day/destination.
    •	If duration_days > 1 or end_destination ≠ start: wizard proposes to add extra day(s) and set Day N+K destination to end_destination_id.
    •	Creates a transfer item if end_destination ≠ start.

---

## 5) Admin UI — Flows & Screens

### 5.1 Itinerary List

    •	Table with filters: status, client, date range. New Itinerary button.

### 5.2 Itinerary Editor (3‑pane layout)

Left Sidebar (Library)
• Tabs: Destinations, Hotels, Excursions, Sights, Tours.
• Search + filters (city, tags, price band).
• Drag items from here.

Center (Days Canvas)
• Sticky header: Title, Client, Start/End Dates (read‑only unless edited), primary actions.
• Day Columns (vertical stack): Each Day card shows
• Day N — {Destination name} — {Date} (date shown when flights set)
• Buttons: “Add Hotel”, “Add Excursion”, “Add Note”
• Droppable list of Day Items with drag handles; reorder supported.
• Quick Hotel picker (dropdown filtered by destination).

Right Sidebar (Inspector)
• Contextual panel showing the selected item properties (hotel or excursion meta, timings, notes). Save/Cancel.

Top Toolbar
• Undo/Redo
• Validate (run checks: missing hotel, overlaps in time, closed days)
• Publish / Export PDF later

### 5.3 Excursion Builder

    •	Header: Title, Start City, End City (optional), Duration (days + minutes budget)
    •	Canvas: DnD timeline of blocks (Sight/Tour/Meal/Buffer/Transfer/Note)
    •	Block Palette: left search; drag Sights/Tours in
    •	Right Inspector: timing, internal notes, customer-facing notes, images
    •	Actions: Save Draft, Publish, Duplicate, Version bump

---

### 6) UX Details for Drag & Drop

    •	Library → Day: dragging an Excursion drops a single itinerary_day_item of type excursion.
    •	Library → Day: dragging a Hotel sets Day hotel and adds a hotel item (or only sets hotel_id shortcut).
    •	Reordering Day Items updates position by 100s to minimize churn; periodic compaction.
    •	Keyboard accessibility: Up/Down to move, Enter to open Inspector.

---

## 7. Validation Rules (MVP)

• Day has 0–1 primary hotel.
• Excursions with multi‑day duration prompt to auto-create required days.
• Operating day mismatch (tour operating days vs date) → warning.
• Time budget overflow (sum block minutes > day budget) → warning.

---

## 8. API Surface (Next.js route handlers via proxy client)

### Itineraries

• POST /api/itineraries → create
• GET /api/itineraries?status=... → list
• GET /api/itineraries/:id → detail (+ days + items)
• PATCH /api/itineraries/:id → update meta
• POST /api/itineraries/:id/compute-dates → apply flight mapping

### Days

• POST /api/itineraries/:id/days → create Day N
• PATCH /api/days/:dayId → update destination, label
• POST /api/days/:dayId/items → add item
• PATCH /api/day-items/:itemId → update item / position
• DELETE /api/day-items/:itemId

### Excursions

• POST /api/excursions → create draft
• GET /api/excursions?destination=tokyo&status=published → library search
• PATCH /api/excursions/:id → update content
• POST /api/excursions/:id/publish

### Flights

• POST /api/itineraries/:id/flights → add inbound/outbound/internal
• POST /api/itineraries/:id/apply-flights → recompute date mapping

All handlers use supabaseApi (proxy) on server.

---

## 9. Component Tree (Admin)

```
/app/admin/itineraries/page.tsx
└─ ItineraryListTable
/app/admin/itineraries/[id]/page.tsx
├─ EditorHeader
├─ EditorRoot (dnd-kit DndContext)
│ ├─ LibrarySidebar
│ │ ├─ LibraryTabs (Destinations/Hotels/Excursions/...)
│ │ └─ LibraryList (virtualized)
│ ├─ DaysCanvas
│ │ └─ DayCard \* N
│ │ └─ DayItemsList (Droppable)
│ └─ InspectorSidebar
└─ ValidateToast / Dialogs

/app/admin/excursions/[id]/page.tsx
├─ ExcursionHeader
├─ ExcursionCanvas (timeline)
├─ BlockPalette
└─ BlockInspector
```

---

## 10. Libraries

    • dnd-kit for drag/drop + sortable.
    • @tanstack/react-query for client cache & optimistic updates.
    • react-hook-form + zod for forms.
    • @tanstack/virtual for large lists.
    • date-fns-tz for timezone-mapped dates.
    • lucide-react + shadcn/ui for UI.

---

## 11. Algorithms & Pseudocode

Map flights to dates

```
function applyFlights(itin) {
const inbound = pickInbound(itin.flights);
const start = localDate(inbound.arrive_at, inbound.timezone_hint);
itin.start_date = start;
for (const day of itin.days) {
day.date = addDays(start, day.day_index - 1);
}
const outbound = pickOutbound(itin.flights);
if (outbound) itin.end_date = localDate(outbound.arrive_at, outbound.timezone_hint);
return itin;
}

Add excursion to a day

function addExcursion(day, template) {
if (template.duration_days > 1 || template.end_destination_id && template.end_destination_id !== template.start_destination_id) {
promptMultiDayWizard(template);
}
createDayItem(day.id, {
type: 'excursion',
ref_id: template.id,
payload: { title: template.title }
});
}
```

---

## 12. Edge Cases

    • Late-night arrival → allow Day 1 offset + label “Arrival”.
    • Golden Week or closed days for sights → validation warning.
    • Double-booking a hotel across days → warn.
    • Deleting Day N reindexes subsequent days and their dates.

---

## 13. MVP Scope (Week 1–2)

    1.  Schemas (SQL + RLS lite for admin).
    2.  Excursion templates (create, publish, library search, DnD blocks in JSON).
    3.  Itinerary editor: create itinerary, add days, drag hotels/excursions, save.
    4.  Flights capture, apply date mapping.
    5.  Basic validation + toasts.

Stretch: multi-day excursions auto‑insert follow-up days; export read‑only customer view.

---

## 14. Sample Payloads

excursion_templates.content (jsonb)

```
{
"blocks": [
{ "type": "sight", "ref": "<sight-uuid>", "minutes": 90, "note_client": "Meet at South Gate" },
{ "type": "buffer", "minutes": 30 },
{ "type": "tour", "ref": "<tour-uuid>", "minutes": 120 },
{ "type": "meal", "label": "Ramen lunch", "minutes": 60 }
]
}

itinerary_day_items

{
"type": "excursion",
"ref_id": "<excursion-uuid>",
"payload": { "override_note": "Start 9:00" },
"position": 1200
}
```

---

## 15. Security & Roles

    • Only role in ('admin','editor') can write.
    • Versioning on excursions; days reference the template id (not a copy) for now.
    • Consider snapshotting excursion JSON into itinerary_day_items.payload.snapshot at time of add (for future edits safety).

---

## 16. Implementation Plan (Concrete)

    • Migrate schema with SQL or Prisma.
    • Build Excursion Builder first (so the Day canvas has content to pull).
    • Build Itinerary Editor (Library → Days DnD, Inspector side panel).
    • Wire flights + date mapping.
    • Ship MVP behind admin auth.

---

## 17. Open Questions (for later)

    • Do we support per‑day time windows (AM/PM blocks)?
    • Should hotels be per‑night (check‑in/out) or per‑day reference only?
    • Customer‑facing PDF/Share link formatting.
