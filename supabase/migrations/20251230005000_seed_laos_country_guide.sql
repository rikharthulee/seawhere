with guide as (
  insert into public.country_guides (country_slug, intro, facts, status)
  values (
    'laos',
    'Plan Laos travel essentials in one place: visas, money, transport, and local tips.',
    '[{"key":"Currency","value":"LAK"},{"key":"Language","value":"Lao"},{"key":"Driving","value":"Right"},{"key":"Plug","value":"A/C/E/F (varies)"},{"key":"SIM","value":"Unitel / Lao Telecom"},{"key":"Payments","value":"Cash + QR common"}]'::jsonb,
    'published'::public.content_status
  )
  on conflict (country_slug) do update
  set intro = excluded.intro,
      facts = excluded.facts,
      status = excluded.status
  returning country_slug
),
sections as (
  insert into public.country_guide_sections (country_slug, title, slug, summary, position, status)
  values
    ('laos', 'Getting there', 'getting-there', 'Flights, land borders, and entry points.', 1, 'published'::public.content_status),
    ('laos', 'Visas', 'visas', 'Entry rules, visa types, and prep.', 2, 'published'::public.content_status),
    ('laos', 'Money', 'money', 'Cash, cards, and daily costs.', 3, 'published'::public.content_status),
    ('laos', 'Getting around', 'getting-around', 'How to move between cities.', 4, 'published'::public.content_status),
    ('laos', 'When to go', 'when-to-go', 'Best seasons and weather.', 5, 'published'::public.content_status),
    ('laos', 'Health and safety', 'health-safety', 'Common risks and prep.', 6, 'published'::public.content_status),
    ('laos', 'Culture and etiquette', 'culture-etiquette', 'Respectful local norms.', 7, 'published'::public.content_status),
    ('laos', 'What to bring', 'what-to-bring', 'Essentials to pack.', 8, 'published'::public.content_status),
    ('laos', 'Dos and donts', 'dos-donts', 'Quick behavior tips.', 9, 'published'::public.content_status)
  on conflict (country_slug, slug) do update
  set title = excluded.title,
      summary = excluded.summary,
      position = excluded.position,
      status = excluded.status
  returning id, slug
),
cleared as (
  delete from public.country_guide_blocks
  where section_id in (select id from sections)
)
insert into public.country_guide_blocks (section_id, type, position, content, status)
select
  sections.id,
  blocks.type,
  blocks.position,
  blocks.content,
  'published'::public.content_status
from sections
join (
  values
    (
      'getting-there',
      'bullets',
      1,
      '{"items":["Most arrivals via Vientiane (VTE) or Luang Prabang (LPQ).","Common connections via Bangkok, Hanoi, and Kuala Lumpur.","Overland entry from Thailand, Vietnam, Cambodia, and China at major crossings."]}'::jsonb
    ),
    (
      'getting-there',
      'callout',
      2,
      '{"variant":"tip","title":"Border timing","text":"Some land borders keep limited hours. Arrive early and carry small cash for fees."}'::jsonb
    ),
    (
      'visas',
      'bullets',
      1,
      '{"items":["Visa on arrival for many nationalities; bring cash and a passport photo.","eVisa is available for select entries; apply online ahead of time.","Passport should be valid 6+ months with blank pages."]}'::jsonb
    ),
    (
      'visas',
      'links',
      2,
      '{"items":[{"label":"Lao eVisa","url":"https://www.laoevisa.gov.la/"}]}'::jsonb
    ),
    (
      'visas',
      'callout',
      3,
      '{"variant":"warning","title":"Check latest rules","text":"Entry requirements can change quickly. Confirm before you travel."}'::jsonb
    ),
    (
      'money',
      'bullets',
      1,
      '{"items":["LAK is the main currency; USD or THB is accepted in some areas.","ATMs are common in cities but scarce in rural towns.","QR payments are popular in cafes, shops, and taxis."]}'::jsonb
    ),
    (
      'money',
      'callout',
      2,
      '{"variant":"note","title":"Keep small change","text":"Bills can be large and change can be limited at markets."}'::jsonb
    ),
    (
      'getting-around',
      'bullets',
      1,
      '{"items":["Domestic flights connect Vientiane, Luang Prabang, and Pakse.","Buses and minivans cover most routes; book a day ahead in high season.","Tuk-tuks and songthaews are best for short trips and town hops."]}'::jsonb
    ),
    (
      'getting-around',
      'callout',
      2,
      '{"variant":"tip","title":"Confirm fares","text":"Agree on price before you ride and carry small notes."}'::jsonb
    ),
    (
      'when-to-go',
      'bullets',
      1,
      '{"items":["Nov to Feb is cooler and driest.","Mar to May is hot and humid.","Jun to Oct brings short heavy rain and greener landscapes."]}'::jsonb
    ),
    (
      'when-to-go',
      'callout',
      2,
      '{"variant":"note","title":"River levels","text":"Boat routes can change in the late wet season."}'::jsonb
    ),
    (
      'health-safety',
      'bullets',
      1,
      '{"items":["Use mosquito repellent for dengue and malaria risk areas.","Tap water is not recommended; use bottled or filtered water.","Carry travel insurance for activities and transport delays."]}'::jsonb
    ),
    (
      'health-safety',
      'callout',
      2,
      '{"variant":"warning","title":"Road conditions","text":"Roads can be rough after dark or in rain. Plan shorter legs."}'::jsonb
    ),
    (
      'culture-etiquette',
      'bullets',
      1,
      '{"items":["Dress modestly at temples with shoulders and knees covered.","Remove shoes before entering homes and temples.","Use both hands when giving or receiving items."]}'::jsonb
    ),
    (
      'culture-etiquette',
      'callout',
      2,
      '{"variant":"tip","title":"Ask before photos","text":"Always ask before photographing people or ceremonies."}'::jsonb
    ),
    (
      'what-to-bring',
      'bullets',
      1,
      '{"items":["Light layers and a rain jacket in wet months.","Power adapter and a small power bank.","Sunscreen and a reusable water bottle."]}'::jsonb
    ),
    (
      'what-to-bring',
      'callout',
      2,
      '{"variant":"note","title":"Cash backup","text":"Keep a reserve of local cash for remote towns."}'::jsonb
    ),
    (
      'dos-donts',
      'bullets',
      1,
      '{"items":["Do greet with a smile and speak softly.","Do carry small change for tuk-tuks and markets.","Do not touch heads or point feet at people or Buddha images.","Do not fly drones near temples or borders without permission."]}'::jsonb
    )
) as blocks(section_slug, type, position, content)
  on sections.slug = blocks.section_slug;
