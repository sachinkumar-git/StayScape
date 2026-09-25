const env = require("../config/env");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function geocode(location, country) {
  if (!env.geocodingEnabled) return null;

  const params = new URLSearchParams({ q: `${location}, ${country}`, format: "json", limit: "1" });
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": "StayScape/1.0 (accommodation booking platform)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const [match] = await response.json();
    if (!match) return null;
    return { type: "Point", coordinates: [Number(match.lon), Number(match.lat)] };
  } catch (err) {
    console.warn(`[geocoding] Lookup failed for "${location}, ${country}": ${err.message}`);
    return null;
  }
}

module.exports = { geocode };
