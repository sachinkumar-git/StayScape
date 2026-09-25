const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Listing = require("../models/Listing");
const AppError = require("../utils/AppError");
const { today } = require("../utils/dates");

async function findReviewableStay(listingId, userId) {
  if (!userId) return null;
  const stays = await Booking.find({
    listing: listingId,
    guest: userId,
    status: "confirmed",
    checkOut: { $lte: today() },
  })
    .sort({ checkOut: -1 })
    .select("_id checkIn checkOut")
    .lean();
  if (stays.length === 0) return null;

  const reviewed = await Review.find({ booking: { $in: stays.map((s) => s._id) } }).distinct("booking");
  const reviewedIds = new Set(reviewed.map(String));
  return stays.find((stay) => !reviewedIds.has(String(stay._id))) || null;
}

async function refreshListingRating(listingId) {
  const [stats] = await Review.aggregate([
    { $match: { listing: listingId } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Listing.updateOne(
    { _id: listingId },
    {
      ratingAverage: stats ? Math.round(stats.average * 100) / 100 : 0,
      reviewCount: stats ? stats.count : 0,
    }
  );
}

async function createReview(listing, author, { rating, comment }) {
  const stay = await findReviewableStay(listing._id, author._id);
  if (!stay) {
    throw new AppError(403, "You can review a place after completing a stay there.");
  }
  const review = await Review.create({ listing: listing._id, author: author._id, booking: stay._id, rating, comment });
  await refreshListingRating(listing._id);
  return review;
}

async function deleteReview(review) {
  await review.deleteOne();
  await refreshListingRating(review.listing);
}

function listForListing(listingId) {
  return Review.find({ listing: listingId }).populate("author", "name").sort({ createdAt: -1 });
}

module.exports = { findReviewableStay, createReview, deleteReview, listForListing, refreshListingRating };
