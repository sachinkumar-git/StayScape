const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const bookingService = require("./bookingService");
const { today } = require("../utils/dates");

async function getOverview(hostId) {
  const now = today();

  const [listings, reservations, upcomingCounts, earnings] = await Promise.all([
    Listing.find({ host: hostId, status: { $ne: "archived" } }).sort({ createdAt: -1 }).lean(),
    bookingService.listForHost(hostId),
    Booking.aggregate([
      { $match: { host: hostId, status: "confirmed", checkOut: { $gt: now } } },
      { $group: { _id: "$listing", count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { host: hostId, status: "confirmed", checkOut: { $lte: now } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, stays: { $sum: 1 } } },
    ]),
  ]);

  const upcomingByListing = new Map(upcomingCounts.map((row) => [String(row._id), row.count]));
  for (const listing of listings) {
    listing.upcomingCount = upcomingByListing.get(String(listing._id)) || 0;
  }

  return {
    listings,
    reservations,
    stats: {
      activeListings: listings.filter((l) => l.status === "active").length,
      upcomingReservations: reservations.upcoming.length,
      completedStays: earnings[0]?.stays || 0,
      earnings: earnings[0]?.total || 0,
    },
  };
}

module.exports = { getOverview };
