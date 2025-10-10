# 🧭 JapanMan Itinerary Checker – Overview

## Purpose

Warn or block itinerary days when included sights are closed or uncertain — **after** the user adds travel dates.  
In browse mode (no dates), show a light disclaimer only.

---

## 🎯 Core Principles

- Keep logic **simple, reliable, and transparent**.
- Only check closures **after dates are known**.
- Use small, clear rules instead of deep automation.
- Treat closures as **warnings, not disasters** (unless a key sight is affected).

---

## 🧱 Data Model (per Sight)

| Field                      | Type  | Description                               |
| -------------------------- | ----- | ----------------------------------------- |
| `closed_days`              | array | e.g. `["MON"]` – recurring weekly closure |
| `holiday_policy`           | enum  | `open` \| `closed` \| `unknown`           |
| `defer_closure_on_holiday` | enum  | `never` \| `next_weekday`                 |
| `notes_url`                | text  | official site link (optional)             |

### Optional flags

- `importance`: `"anchor"` or `"nice"` – used inside excursions.
- `category` / `division`: for swap suggestions.

---

## 📅 Central Holiday List

- Cached once per year from **Nager.Date API** or **Google Japan Holiday ICS**.
- Normalized to `{ date, name, type }`.
- Used globally – sights reference it, not duplicate it.

---

## ⚙️ Checker Logic (simplified)

1. **Hard Exceptions**

   - e.g. maintenance, New Year closures → immediate block.

2. **Holiday Check**

   - If `holiday_policy = closed` → `CLOSED (holiday)`
   - If `holiday_policy = open` → `OPEN (holiday)`
   - If `holiday_policy = unknown` → `UNKNOWN (holiday — check manually)`

3. **Weekly Closure**

   - If `weekday ∈ closed_days` → `CLOSED (recurring)`

4. **Deferred Closure**

   - If **yesterday was a holiday** and `defer_closure_on_holiday = next_weekday`  
     → `CLOSED (deferred)` (unless today is also a holiday)

5. **Default**
   - Otherwise → `OPEN (normal)`

---

## 🚦 Result States

| State       | Meaning                    | Example UI           |
| ----------- | -------------------------- | -------------------- |
| ✅ OPEN     | Good to go                 | Green dot            |
| ⚠️ UNKNOWN  | Likely open but unverified | Amber dot            |
| ⛔ CLOSED   | Confirmed closure          | Greyed out / tooltip |
| ❄️ DEFERRED | Closed day after holiday   | Greyed out / tooltip |

---

## 🧩 Excursion-Level Logic

1. Each excursion step tagged `importance = "anchor" | "nice"`.
2. If any **anchor** is closed → block day (`⛔`).
3. If only **nice-to-haves** closed → allow with warning (`⚠️`).
4. Suggest swaps for closed nice-to-haves:
   - Same `category`
   - Same `division`
   - Confirmed `OPEN` on that date

---

## 💬 UX Copy Examples

- “Closed every Monday.”
- “Open on holidays; closed the following day.”
- “National holiday — hours may differ. Please check the official site.”
- “Closed today (deferred rest day after holiday).”

---

## 🧮 Pseudocode Summary

```ts
function sightStatus(s, date) {
  if (hasException(s, date)) return CLOSED("Exception");

  const isHol = isHoliday(date);
  const wd = weekday(date);

  if (isHol) {
    if (s.holiday_policy === "closed") return CLOSED("Holiday");
    if (s.holiday_policy === "open") return OPEN("Holiday");
    return UNKNOWN("Holiday – check");
  }

  if (s.closed_days?.includes(wd)) return CLOSED("Recurring");

  const prev = addDays(date, -1);
  if (
    isHoliday(prev) &&
    s.closed_days?.includes(weekday(prev)) &&
    s.defer_closure_on_holiday === "next_weekday" &&
    !isHoliday(date)
  ) {
    return CLOSED("Deferred");
  }

  return OPEN("Normal");
}
```
