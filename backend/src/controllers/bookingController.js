const bookingService = require("../services/bookingService");

async function create(req, res) {
  const booking = await bookingService.createBooking(req.listing, req.user, req.body.booking);
  res.status(201).json({ booking });
}

function show(req, res) {
  const { booking } = req;
  res.json({ booking, viewerIsHost: booking.host._id.equals(req.user._id) });
}

async function cancel(req, res) {
  const booking = await bookingService.cancelBooking(req.booking, req.user);
  res.json({ booking });
}

async function trips(req, res) {
  res.json(await bookingService.listForGuest(req.user._id));
}

module.exports = { create, show, cancel, trips };
