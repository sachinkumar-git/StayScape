const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const listingService = require("../services/listingService");
const AppError = require("../utils/AppError");

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return next(new AppError(401, "Please log in to continue."));
}

function validateObjectId(req, res, next, value) {
  if (!mongoose.isValidObjectId(value)) return next(new AppError(404, "Page not found."));
  return next();
}

async function loadListing(req, res, next) {
  const listing = await listingService.findVisibleById(req.params.id);
  if (!listing) throw new AppError(404, "This listing doesn't exist or has been removed.");
  req.listing = listing;
  next();
}

function requireListingHost(req, res, next) {
  if (!req.listing.isHostedBy(req.user)) {
    return next(new AppError(403, "Only the host can manage this listing."));
  }
  return next();
}

async function loadBookingForParticipant(req, res, next) {
  const booking = await Booking.findById(req.params.id)
    .populate("listing", "title location country images status pricePerNight host")
    .populate("guest", "name email")
    .populate("host", "name email");

  if (!booking || !booking.involves(req.user)) throw new AppError(404, "Booking not found.");
  req.booking = booking;
  next();
}

async function loadOwnReview(req, res, next) {
  const review = await Review.findOne({ _id: req.params.reviewId, listing: req.listing._id });
  if (!review) throw new AppError(404, "Review not found.");
  if (!review.author.equals(req.user._id)) {
    throw new AppError(403, "You can only delete your own reviews.");
  }
  req.review = review;
  next();
}

module.exports = {
  requireAuth,
  validateObjectId,
  loadListing,
  requireListingHost,
  loadBookingForParticipant,
  loadOwnReview,
};
