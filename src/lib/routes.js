export function countryPath(countrySlug) {
  if (!countrySlug) return "/countries";
  return `/countries/${encodeURIComponent(countrySlug)}`;
}

export function destinationPath(countrySlug, destinationSlug) {
  if (!countrySlug || !destinationSlug) return "/countries";
  return `/countries/${encodeURIComponent(countrySlug)}/${encodeURIComponent(
    destinationSlug
  )}`;
}

export function destinationSectionPath(countrySlug, destinationSlug, section) {
  if (!section) return destinationPath(countrySlug, destinationSlug);
  return `${destinationPath(countrySlug, destinationSlug)}/${encodeURIComponent(
    section
  )}`;
}

export function destinationItemPath(
  countrySlug,
  destinationSlug,
  section,
  itemSlug
) {
  if (!itemSlug) return destinationSectionPath(countrySlug, destinationSlug, section);
  return `${destinationSectionPath(
    countrySlug,
    destinationSlug,
    section
  )}/${encodeURIComponent(itemSlug)}`;
}
