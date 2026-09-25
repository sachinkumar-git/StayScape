const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const { parseDateOnly, today, addDays, nightsBetween, toISODate } = require("../utils/dates");
const { MAX_NIGHTS, MAX_DAYS_IN_ADVANCE } = require("../constants/booking");

function quote(listing, nights) {
  const subtotal = listing.pricePerNight * nights;
  const cleaningFee = listing.cleaningFee || 0;
  return { nights, pricePerNight: listing.pricePerNight, subtotal, cleaningFee, total: subtotal + cleaningFee };
}

function overlapQuery(listingId, checkIn, checkOut) {
  return {
    listing: listingId,
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
}

async function getUnavailableRanges(listingId) {
  const bookings = await Booking.find({
    listing: listingId,
    status: "confirmed",
    checkOut: { $gt: today() },
  })
    .select("checkIn checkOut")
    .sort({ checkIn: 1 })
    .lean();

  return bookings.map((b) => ({ from: toISODate(b.checkIn), to: toISODate(addDays(b.checkOut, -1)) }));
}

function validateStay(listing, guest, { checkIn, checkOut, guests }) {
  if (listing.status !== "active") {
    throw new AppError(409, "This place isn't accepting bookings right now.");
  }
  if (listing.isHostedBy(guest)) {
    throw new AppError(403, "You can't book your own listing.");
  }

  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end) throw new AppError(400, "Please choose valid check-in and check-out dates.");
  if (start < today()) throw new AppError(400, "Check-in can't be in the past.");
  if (start > addDays(today(), MAX_DAYS_IN_ADVANCE)) {
    throw new AppError(400, "Bookings can be made up to one year in advance.");
  }

  const nights = nightsBetween(start, end);
  if (nights < 1) throw new AppError(400, "Check-out must be after check-in.");
  if (nights > MAX_NIGHTS) throw new AppError(400, `Stays are limited to ${MAX_NIGHTS} nights.`);
  if (guests > listing.maxGuests) {
    throw new AppError(400, `This place hosts up to ${listing.maxGuests} guests.`);
  }

  return { start, end, nights };
}

const UNAVAILABLE = "Sorry, some of those dates were just booked. Please pick different dates.";

async function createBooking(listing, guest, input) {
  const { start, end, nights } = validateStay(listing, guest, input);

  if (await Booking.exists(overlapQuery(listing._id, start, end))) {
    throw new AppError(409, UNAVAILABLE);
  }

  const price = quote(listing, nights);
  const booking = await Booking.create({
    listing: listing._id,
    guest: guest._id,
    host: listing.host._id || listing.host,
    checkIn: start,
    checkOut: end,
    guests: input.guests,
    nights,
    pricePerNight: price.pricePerNight,
    cleaningFee: price.cleaningFee,
    totalPrice: price.total,
  });

  const earlierConflict = await Booking.exists({
    ...overlapQuery(listing._id, start, end),
    _id: { $lt: booking._id },
  });
  if (earlierConflict) {
    await booking.deleteOne();
    throw new AppError(409, UNAVAILABLE);
  }

  return booking;
}

async function cancelBooking(booking, user) {
  if (!booking.isCancellable) {
    throw new AppError(409, "Only upcoming reservations can be cancelled.");
  }
  const hostId = booking.host._id || booking.host;
  booking.status = "cancelled";
  booking.cancelledBy = hostId.equals(user._id) ? "host" : "guest";
  booking.cancelledAt = new Date();
  await booking.save();
  return booking;
}

function groupByPhase(bookings) {
  const groups = { upcoming: [], past: [], cancelled: [] };
  for (const booking of bookings) {
    if (booking.phase === "cancelled") groups.cancelled.push(booking);
    else if (booking.phase === "completed") groups.past.push(booking);
    else groups.upcoming.push(booking);
  }
  groups.upcoming.sort((a, b) => a.checkIn - b.checkIn);
  return groups;
}

async function listForGuest(guestId) {
  const bookings = await Booking.find({ guest: guestId })
    .populate("listing", "title location country images status")
    .populate("host", "name")
    .sort({ checkIn: -1 });
  return groupByPhase(bookings);
}

async function listForHost(hostId) {
  const bookings = await Booking.find({ host: hostId })
    .populate("listing", "title location country images status")
    .populate("guest", "name")
    .sort({ checkIn: -1 });
  return groupByPhase(bookings);
}

module.exports = {
  quote,
  getUnavailableRanges,
  validateStay,
  createBooking,
  cancelBooking,
  listForGuest,
  listForHost,
};
