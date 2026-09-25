const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { parseDateOnly, today } = require("../utils/dates");
const { escapeRegex } = require("../utils/format");
const { PAGE_SIZE, MAX_PHOTOS } = require("../constants/listing");
const geocodingService = require("./geocodingService");
const imageStorage = require("./imageStorage");

const SORTS = {
  rating: { ratingAverage: -1, reviewCount: -1, createdAt: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
  price_asc: { pricePerNight: 1, _id: 1 },
  price_desc: { pricePerNight: -1, _id: 1 },
};

function bookedListingIds(checkIn, checkOut) {
  return Booking.distinct("listing", {
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
}

async function search(filters) {
  const query = { status: "active" };

  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q), "i");
    query.$or = [{ title: pattern }, { location: pattern }, { country: pattern }];
  }
  if (filters.type) query.propertyType = filters.type;
  if (filters.guests) query.maxGuests = { $gte: filters.guests };
  if (filters.bedrooms) query.bedrooms = { $gte: filters.bedrooms };
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };
  if (filters.minPrice != null || filters.maxPrice != null) {
    query.pricePerNight = {};
    if (filters.minPrice != null) query.pricePerNight.$gte = filters.minPrice;
    if (filters.maxPrice != null) query.pricePerNight.$lte = filters.maxPrice;
  }

  const checkIn = parseDateOnly(filters.checkIn);
  const checkOut = parseDateOnly(filters.checkOut);
  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);
  if (hasDates) {
    query._id = { $nin: await bookedListingIds(checkIn, checkOut) };
  }

  const total = await Listing.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page || 1, pages);
  const listings = await Listing.find(query)
    .sort(SORTS[filters.sort] || SORTS.rating)
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  return { listings, total, page, pages, hasDates };
}

async function findVisibleById(id) {
  const listing = await Listing.findById(id).populate("host", "name createdAt");
  if (!listing || listing.status === "archived") return null;
  return listing;
}

function assertPhotoCount(count) {
  if (count < 1) throw new AppError(400, "Please add at least one photo of your place.");
  if (count > MAX_PHOTOS) throw new AppError(400, `A listing can have up to ${MAX_PHOTOS} photos.`);
}

async function createListing(hostId, data, files = []) {
  assertPhotoCount(files.length);

  const [geometry, images] = await Promise.all([
    geocodingService.geocode(data.location, data.country),
    Promise.all(files.map((file) => imageStorage.saveImage(file))),
  ]);

  return Listing.create({ ...data, host: hostId, images, geometry: geometry || undefined });
}

async function updateListing(listing, { removeImages = [], ...data }, files = []) {
  const removed = new Set(removeImages);
  const kept = listing.images.filter((image) => !removed.has(image.url));
  const dropped = listing.images.filter((image) => removed.has(image.url));
  assertPhotoCount(kept.length + files.length);

  const locationChanged = data.location !== listing.location || data.country !== listing.country;
  listing.set(data);
  if (locationChanged || !listing.geometry) {
    const geometry = await geocodingService.geocode(data.location, data.country);
    listing.geometry = geometry || undefined;
  }

  const added = await Promise.all(files.map((file) => imageStorage.saveImage(file)));
  listing.images = [...kept.map((image) => image.toObject()), ...added];

  await listing.save();
  await Promise.all(dropped.map((image) => imageStorage.deleteImage(image)));
  return listing;
}

async function setStatus(listing, status) {
  listing.status = status;
  await listing.save();
  return listing;
}

async function removeListing(listing) {
  const upcoming = await Booking.countDocuments({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gt: today() },
  });
  if (upcoming > 0) {
    throw new AppError(
      409,
      "This listing has upcoming reservations. Cancel them before deleting it, or pause the listing instead."
    );
  }

  const hasHistory = await Booking.exists({ listing: listing._id });
  if (hasHistory) {
    listing.status = "archived";
    await listing.save();
    return { archived: true };
  }

  await Promise.all([Review.deleteMany({ listing: listing._id }), listing.deleteOne()]);
  await Promise.all(listing.images.map((image) => imageStorage.deleteImage(image)));
  return { archived: false };
}

module.exports = { search, findVisibleById, createListing, updateListing, setStatus, removeListing };
