const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Listing = require("../../src/models/Listing");
const bookingService = require("../../src/services/bookingService");
const { parseDateOnly, nightsBetween, toISODate, addDays, today } = require("../../src/utils/dates");

const hostId = new mongoose.Types.ObjectId();
const listing = new Listing({ host: hostId, pricePerNight: 2500, cleaningFee: 400, maxGuests: 2, status: "active" });
const guest = { _id: new mongoose.Types.ObjectId() };
const day = (offset) => toISODate(addDays(today(), offset));

describe("date helpers", () => {
  it("parses calendar dates as UTC midnight", () => {
    assert.equal(parseDateOnly("2026-10-12").toISOString(), "2026-10-12T00:00:00.000Z");
  });

  it("rejects impossible or malformed dates", () => {
    assert.equal(parseDateOnly("2026-02-30"), null);
    assert.equal(parseDateOnly("12/10/2026"), null);
    assert.equal(parseDateOnly(undefined), null);
  });

  it("counts nights between dates", () => {
    assert.equal(nightsBetween(parseDateOnly("2026-12-30"), parseDateOnly("2027-01-02")), 3);
  });
});

describe("booking rules", () => {
  it("prices a stay as nights × nightly rate plus the cleaning fee", () => {
    assert.deepEqual(bookingService.quote(listing, 3), {
      nights: 3,
      pricePerNight: 2500,
      subtotal: 7500,
      cleaningFee: 400,
      total: 7900,
    });
  });

  it("accepts a valid stay", () => {
    const { nights } = bookingService.validateStay(listing, guest, { checkIn: day(3), checkOut: day(5), guests: 2 });
    assert.equal(nights, 2);
  });

  const rejects = (input, message, who = guest, target = listing) =>
    assert.throws(() => bookingService.validateStay(target, who, input), { message });

  it("rejects stays that break the rules", () => {
    rejects({ checkIn: day(-1), checkOut: day(2), guests: 1 }, "Check-in can't be in the past.");
    rejects({ checkIn: day(4), checkOut: day(4), guests: 1 }, "Check-out must be after check-in.");
    rejects({ checkIn: day(1), checkOut: day(40), guests: 1 }, "Stays are limited to 30 nights.");
    rejects({ checkIn: day(400), checkOut: day(402), guests: 1 }, "Bookings can be made up to one year in advance.");
    rejects({ checkIn: day(1), checkOut: day(2), guests: 3 }, "This place hosts up to 2 guests.");
    rejects({ checkIn: "tomorrow", checkOut: day(2), guests: 1 }, "Please choose valid check-in and check-out dates.");
  });

  it("does not let hosts book their own place or anyone book a paused one", () => {
    const stay = { checkIn: day(1), checkOut: day(2), guests: 1 };
    rejects(stay, "You can't book your own listing.", { _id: hostId });
    const paused = new Listing({ host: hostId, pricePerNight: 1000, maxGuests: 2, status: "paused" });
    rejects(stay, "This place isn't accepting bookings right now.", guest, paused);
  });
});
