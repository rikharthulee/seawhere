"use client";
import Excursions from "@/components/Excursions";

<Excursions />;

import POIPickerSheet from "@/components/ExcursionBuilder";

<POIPickerSheet
  open={open}
  onOpenChange={setOpen}
  onAdd={(poi) => {
    // Insert into excursion_items with next sort_order
    // { item_type: poi.kind, ref_id: poi.id, name: poi.name }
  }}
  searchPois={async (q) => {
    // Replace with Supabase search over sights/experiences/tours/food_drink/hotels
    // Return a flat array: [{id, name, kind, destination}]
    return fetch(`/api/pois?q=${encodeURIComponent(q)}`).then((r) => r.json());
  }}
/>;
