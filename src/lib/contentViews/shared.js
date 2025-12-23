export const CONTENT_TYPES = {
  DESTINATION: "destination",
  SIGHT: "sight",
  FOOD_DRINK: "food_drink",
  EXPERIENCE: "experience",
  TRIP: "trip",
  ACCOMMODATION: "accommodation",
  TOUR: "tour",
};

export function buildViewSessionKey(type, id) {
  if (!type || !id) return null;
  return `viewed:${type}:${id}`;
}
