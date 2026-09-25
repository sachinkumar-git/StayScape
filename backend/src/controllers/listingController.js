const listingService = require("../services/listingService");
const bookingService = require("../services/bookingService");
const reviewService = require("../services/reviewService");
const { searchQuery } = require("../validators");
const { currentCurrency } = require("../utils/currency");
const { toBaseCurrency } = require("../utils/format");
const AppError = require("../utils/AppError");

async function index(req, res) {
  const { value: filters } = searchQuery.validate(req.query, { stripUnknown: true });
  const currencyCode = currentCurrency(req);

  const result = await listingService.search({
    ...filters,
    minPrice: filters.minPrice != null ? toBaseCurrency(filters.minPrice, currencyCode) : null,
    maxPrice: filters.maxPrice != null ? toBaseCurrency(filters.maxPrice, currencyCode) : null,
  });

  res.json({
    filters: {
      q: filters.q ?? null,
      type: filters.type ?? null,
      minPrice: filters.minPrice ?? null,
      maxPrice: filters.maxPrice ?? null,
      guests: filters.guests ?? null,
      bedrooms: filters.bedrooms ?? null,
      amenities: filters.amenities,
      checkIn: filters.checkIn ?? null,
      checkOut: filters.checkOut ?? null,
      sort: filters.sort,
      view: filters.view,
      page: result.page,
    },
    activeFilterCount: filters.amenities.length + (filters.bedrooms ? 1 : 0),
    ...result,
  });
}

async function show(req, res) {
  const { listing } = req;
  const isHost = listing.isHostedBy(req.user);

  const [reviews, unavailableRanges, reviewableStay] = await Promise.all([
    reviewService.listForListing(listing._id),
    bookingService.getUnavailableRanges(listing._id),
    isHost ? null : reviewService.findReviewableStay(listing._id, req.user?._id),
  ]);

  res.json({ listing, reviews, isHost, canReview: Boolean(reviewableStay), unavailableRanges });
}

function photoError(res, err) {
  if (err instanceof AppError && err.statusCode === 400) {
    return res.status(400).json({ error: err.message, errors: { images: err.message } });
  }
  throw err;
}

async function create(req, res) {
  try {
    const listing = await listingService.createListing(req.user._id, req.body.listing, req.files);
    res.status(201).json({ listing });
  } catch (err) {
    photoError(res, err);
  }
}

async function update(req, res) {
  try {
    const listing = await listingService.updateListing(req.listing, req.body.listing, req.files);
    res.json({ listing });
  } catch (err) {
    photoError(res, err);
  }
}

async function updateStatus(req, res) {
  const listing = await listingService.setStatus(req.listing, req.body.status);
  res.json({ listing });
}

async function destroy(req, res) {
  const result = await listingService.removeListing(req.listing);
  res.json(result);
}

module.exports = { index, show, create, update, updateStatus, destroy };
