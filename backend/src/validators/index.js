const Joi = require("joi");
const { PROPERTY_TYPE_KEYS, AMENITY_KEYS, SORT_KEYS, VIEWS, MAX_PHOTOS } = require("../constants/listing");
const { CURRENCY_CODES } = require("../constants/currency");
const { MAX_GUESTS } = require("../constants/booking");

const isoDate = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const text = (label, min, max) => Joi.string().trim().min(min).max(max).required().label(label);
const count = (label, min, max) => Joi.number().integer().min(min).max(max).empty("").label(label);

const listing = Joi.object({
  listing: Joi.object({
    title: text("Title", 5, 100),
    description: text("Description", 30, 2000),
    propertyType: Joi.string().valid(...PROPERTY_TYPE_KEYS).required().label("Property type"),
    location: text("City or area", 2, 80),
    country: text("Country", 2, 60),
    pricePerNight: count("Nightly price", 300, 200000).required(),
    cleaningFee: count("Cleaning fee", 0, 20000).empty("").default(0),
    maxGuests: count("Guests", 1, MAX_GUESTS).required(),
    bedrooms: count("Bedrooms", 0, 20).required(),
    beds: count("Beds", 1, 40).required(),
    bathrooms: count("Bathrooms", 0, 20).required(),
    amenities: Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).single().default([]).label("Amenities"),
    removeImages: Joi.array().items(Joi.string().max(500)).max(MAX_PHOTOS).single().default([]),
  }).required(),
});

const listingStatus = Joi.object({
  status: Joi.string().valid("active", "paused").required(),
});

const booking = Joi.object({
  booking: Joi.object({
    checkIn: isoDate.required().label("Check-in date"),
    checkOut: isoDate.required().label("Check-out date"),
    guests: count("Guests", 1, MAX_GUESTS).required(),
  }).required(),
});

const review = Joi.object({
  review: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().label("Rating"),
    comment: text("Review", 10, 1000),
  }).required(),
});

const signup = Joi.object({
  name: text("Name", 2, 60),
  email: Joi.string().trim().lowercase().email().max(254).required().label("Email"),
  password: Joi.string().min(8).max(128).required().label("Password"),
});

const login = Joi.object({
  email: Joi.string().trim().max(254).required().label("Email"),
  password: Joi.string().max(128).required().label("Password"),
});

const optional = (schema, fallback = null) => schema.empty("").failover(fallback);
const searchQuery = Joi.object({
  q: optional(Joi.string().trim().max(100)),
  type: optional(Joi.string().valid(...PROPERTY_TYPE_KEYS)),
  minPrice: optional(Joi.number().integer().min(0)),
  maxPrice: optional(Joi.number().integer().min(0)),
  guests: optional(Joi.number().integer().min(1).max(MAX_GUESTS)),
  bedrooms: optional(Joi.number().integer().min(1).max(20)),
  amenities: optional(Joi.array().items(Joi.string().valid(...AMENITY_KEYS)).single().unique(), []).default([]),
  checkIn: optional(isoDate),
  checkOut: optional(isoDate),
  sort: optional(Joi.string().valid(...SORT_KEYS), "rating").default("rating"),
  page: optional(Joi.number().integer().min(1).max(1000), 1).default(1),
  view: optional(Joi.string().valid(...VIEWS), "grid").default("grid"),
});

const currency = Joi.object({
  currency: Joi.string().valid(...CURRENCY_CODES).required(),
});

module.exports = { listing, listingStatus, booking, review, signup, login, searchQuery, currency };
