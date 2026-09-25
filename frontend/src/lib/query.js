const DEFAULTS = { sort: "rating", view: "grid", page: 1 };

function toPairs(filters) {
  const pairs = [];
  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "" || value === DEFAULTS[key]) continue;
    for (const item of [].concat(value)) pairs.push([key, String(item)]);
  }
  return pairs;
}

export function hrefWith(filters, changes = {}) {
  const query = new URLSearchParams(toPairs({ ...filters, page: null, ...changes })).toString();
  return query ? `/listings?${query}` : "/listings";
}

export function stayQuery(filters) {
  return new URLSearchParams(toPairs({ checkIn: filters.checkIn, checkOut: filters.checkOut, guests: filters.guests })).toString();
}

export const blankToNull = (value) => (value === "" || value == null ? null : value);
