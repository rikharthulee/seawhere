do $$
begin
  if exists (select 1 from pg_type where typname = 'day_itinerary_item_type') then
    begin
      alter type day_itinerary_item_type add value 'destination';
    exception when duplicate_object then null;
    end;
  end if;
end $$;
