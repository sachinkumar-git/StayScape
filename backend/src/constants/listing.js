const PROPERTY_TYPES = [
  { key: "apartment", label: "Apartment", icon: "fa-regular fa-building" },
  { key: "house", label: "House", icon: "fa-solid fa-house" },
  { key: "villa", label: "Villa", icon: "fa-solid fa-umbrella-beach" },
  { key: "cottage", label: "Cottage", icon: "fa-solid fa-house-chimney" },
  { key: "cabin", label: "Cabin", icon: "fa-solid fa-tree" },
  { key: "houseboat", label: "Houseboat", icon: "fa-solid fa-ship" },
  { key: "glamping", label: "Glamping", icon: "fa-solid fa-tent" },
  { key: "farmstay", label: "Farmstay", icon: "fa-solid fa-leaf" },
];

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi", icon: "fa-wifi" },
  { key: "kitchen", label: "Kitchen", icon: "fa-kitchen-set" },
  { key: "ac", label: "Air conditioning", icon: "fa-snowflake" },
  { key: "heating", label: "Heating", icon: "fa-temperature-high" },
  { key: "parking", label: "Free parking", icon: "fa-square-parking" },
  { key: "pool", label: "Pool", icon: "fa-water-ladder" },
  { key: "workspace", label: "Dedicated workspace", icon: "fa-laptop" },
  { key: "washer", label: "Washing machine", icon: "fa-shirt" },
  { key: "tv", label: "TV", icon: "fa-tv" },
  { key: "breakfast", label: "Breakfast included", icon: "fa-mug-hot" },
  { key: "pets", label: "Pets allowed", icon: "fa-paw" },
  { key: "fireplace", label: "Fireplace", icon: "fa-fire" },
];

const LISTING_STATUSES = ["active", "paused", "archived"];

const SORT_OPTIONS = [
  { key: "rating", label: "Top rated" },
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

const VIEWS = ["grid", "map"];

const lookup = (list) => Object.fromEntries(list.map((item) => [item.key, item]));

module.exports = {
  PROPERTY_TYPES,
  PROPERTY_TYPE_KEYS: PROPERTY_TYPES.map((t) => t.key),
  PROPERTY_TYPE_MAP: lookup(PROPERTY_TYPES),
  AMENITIES,
  AMENITY_KEYS: AMENITIES.map((a) => a.key),
  AMENITY_MAP: lookup(AMENITIES),
  LISTING_STATUSES,
  SORT_OPTIONS,
  SORT_KEYS: SORT_OPTIONS.map((s) => s.key),
  VIEWS,
  PAGE_SIZE: 12,
  MAX_PHOTOS: 5,
};
