const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { request, startApp, stopApp, csrfToken, send, signup, isoFromToday, TINY_PNG } = require("../helpers");
const Listing = require("../../src/models/Listing");
const Booking = require("../../src/models/Booking");
const Review = require("../../src/models/Review");
const { addDays, today } = require("../../src/utils/dates");

const LISTING = {
  "listing[title]": "Quiet orchard cottage near Naggar",
  "listing[description]": "A two-room cottage in an apple orchard with a view of the Kullu valley and a wood stove.",
  "listing[propertyType]": "cottage",
  "listing[location]": "Naggar, Himachal Pradesh",
  "listing[country]": "India",
  "listing[pricePerNight]": "4000",
  "listing[cleaningFee]": "500",
  "listing[maxGuests]": "3",
  "listing[bedrooms]": "1",
  "listing[beds]": "2",
  "listing[bathrooms]": "1",
};

async function sendListing(agent, method, url, fields, { images = 2, extra = [] } = {}) {
  const token = await csrfToken(agent);
  let req = agent[method](url).set("X-CSRF-Token", token);
  for (const [key, value] of [...Object.entries(fields), ...extra]) req = req.field(key, value);
  req = req.field("listing[amenities]", "wifi").field("listing[amenities]", "heating");
  for (let i = 0; i < images; i++) {
    req = req.attach("images", TINY_PNG, { filename: `photo-${i}.png`, contentType: "image/png" });
  }
  return req;
}

const book = (agent, listingId, checkIn, checkOut, guests = 2) =>
  send(agent, "post", `/api/listings/${listingId}/bookings`, { booking: { checkIn, checkOut, guests } });

const searchTitles = async (agent, query) => (await agent.get(`/api/listings?${query}`)).body.listings.map((l) => l.title);

describe("guest → booking → host workflow", () => {
  let app;
  let host;
  let guest;
  let otherGuest;
  let listingId;
  let bookingId;

  before(async () => {
    app = await startApp();
    host = await signup(app, "Tara Negi", "tara@example.com");
    guest = await signup(app, "Kabir Sethi", "kabir@example.com");
    otherGuest = await signup(app, "Isha Menon", "isha@example.com");
  });

  after(async () => {
    const listing = listingId && (await Listing.findById(listingId));
    for (const image of listing?.images || []) {
      if (image.provider === "local") {
        fs.rmSync(path.join(__dirname, "../../public/uploads", image.filename), { force: true });
      }
    }
    await stopApp();
  });

  it("rejects state-changing requests without a CSRF token", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "x@example.com", password: "x" });
    assert.equal(res.status, 403);
  });

  it("sends security headers that keep referrers on-site", async () => {
    const res = await request(app).get("/api/listings");
    assert.equal(res.headers["referrer-policy"], "same-origin");
    assert.match(res.headers["content-security-policy"], /script-src 'self'/);
  });

  it("describes the session, including the CSRF token and display currency", async () => {
    const res = await request(app).get("/api/session");
    assert.equal(res.body.user, null);
    assert.match(res.body.csrfToken, /^[a-f0-9]{48}$/);
    assert.equal(res.body.currency.code, "INR");
    assert.ok(res.body.meta.propertyTypes.length > 0);
  });

  it("requires login to create a listing", async () => {
    const anonymous = request.agent(app);
    const res = await send(anonymous, "post", "/api/listings", {});
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Please log in to continue.");
  });

  it("returns field errors when listing input is invalid", async () => {
    const res = await sendListing(host, "post", "/api/listings", { ...LISTING, "listing[title]": "Hi", "listing[pricePerNight]": "-5" });
    assert.equal(res.status, 400);
    assert.equal(res.body.errors["listing.title"], "Title length must be at least 5 characters long");
    assert.equal(res.body.errors["listing.pricePerNight"], "Nightly price must be greater than or equal to 300");
    assert.equal(await Listing.countDocuments(), 0);
  });

  it("lets a host publish a listing with photos", async () => {
    const res = await sendListing(host, "post", "/api/listings", LISTING);
    assert.equal(res.status, 201);
    listingId = res.body.listing._id;

    const listing = await Listing.findById(listingId);
    assert.equal(listing.title, LISTING["listing[title]"]);
    assert.deepEqual([...listing.amenities], ["wifi", "heating"]);
    assert.equal(listing.images.length, 2);
    assert.equal(listing.images[0].provider, "local");

    const page = await request(app).get(`/api/listings/${listingId}`);
    assert.equal(page.status, 200);
    assert.equal(page.body.listing.title, "Quiet orchard cottage near Naggar");
    assert.equal(page.body.listing.host.name, "Tara Negi");
  });

  it("finds the listing through search and filters", async () => {
    assert.deepEqual(await searchTitles(request(app), "q=naggar"), ["Quiet orchard cottage near Naggar"]);
    assert.deepEqual(await searchTitles(request(app), "q=naggar&guests=6"), []);
    assert.deepEqual(await searchTitles(request(app), "q=naggar&type=villa"), []);
  });

  it("filters by amenities, bedrooms and price", async () => {
    assert.equal((await searchTitles(request(app), "q=naggar&amenities=wifi&amenities=heating&bedrooms=1")).length, 1);
    assert.equal((await searchTitles(request(app), "q=naggar&amenities=pool")).length, 0);
    assert.equal((await searchTitles(request(app), "q=naggar&maxPrice=3000")).length, 0);
    const res = await request(app).get("/api/listings?q=naggar&amenities=wifi&view=map");
    assert.deepEqual(res.body.filters.amenities, ["wifi"]);
    assert.equal(res.body.filters.view, "map");
    assert.equal(res.body.activeFilterCount, 1);
  });

  it("remembers the chosen currency and applies it to price filters", async () => {
    const agent = request.agent(app);
    const res = await send(agent, "post", "/api/preferences/currency", { currency: "USD" });
    assert.equal(res.body.currency.code, "USD");
    assert.equal((await agent.get("/api/session")).body.currency.code, "USD");
    assert.equal((await searchTitles(agent, "q=naggar&maxPrice=40")).length, 0);
    assert.equal((await searchTitles(agent, "q=naggar&maxPrice=60")).length, 1);
  });

  it("lets a signed-in guest save and unsave a listing", async () => {
    const save = await send(guest, "post", `/api/wishlist/${listingId}`);
    assert.deepEqual(save.body, { saved: true });
    assert.deepEqual((await guest.get("/api/session")).body.wishlist, [listingId]);
    assert.equal((await guest.get("/api/wishlist")).body.listings.length, 1);

    const unsave = await send(guest, "post", `/api/wishlist/${listingId}`);
    assert.deepEqual(unsave.body, { saved: false });
    assert.equal((await guest.get("/api/wishlist")).body.listings.length, 0);
  });

  it("keeps at least one photo when the host removes photos", async () => {
    const listing = await Listing.findById(listingId);
    const res = await sendListing(host, "put", `/api/listings/${listingId}`, LISTING, {
      images: 0,
      extra: listing.images.map((image) => ["listing[removeImages]", image.url]),
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.errors.images, "Please add at least one photo of your place.");
    assert.equal((await Listing.findById(listingId)).images.length, 2);
  });

  it("only lets the host edit the listing", async () => {
    const res = await sendListing(guest, "put", `/api/listings/${listingId}`, LISTING, { images: 0 });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "Only the host can manage this listing.");
    assert.equal((await guest.get(`/api/listings/${listingId}`)).body.isHost, false);
    assert.equal((await host.get(`/api/listings/${listingId}`)).body.isHost, true);
  });

  it("does not let a host book their own listing", async () => {
    const res = await book(host, listingId, isoFromToday(10), isoFromToday(13));
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "You can't book your own listing.");
    assert.equal(await Booking.countDocuments(), 0);
  });

  it("validates booking dates and guest count", async () => {
    assert.equal((await book(guest, listingId, isoFromToday(-2), isoFromToday(1))).body.error, "Check-in can't be in the past.");
    assert.equal((await book(guest, listingId, isoFromToday(5), isoFromToday(5))).body.error, "Check-out must be after check-in.");
    assert.equal((await book(guest, listingId, isoFromToday(5), isoFromToday(7), 4)).body.error, "This place hosts up to 3 guests.");
    assert.equal(await Booking.countDocuments(), 0);
  });

  it("lets a guest book available dates at the listed price", async () => {
    const res = await book(guest, listingId, isoFromToday(10), isoFromToday(13));
    assert.equal(res.status, 201);
    bookingId = res.body.booking._id;
    assert.equal(res.body.booking.nights, 3);
    assert.equal(res.body.booking.totalPrice, 3 * 4000 + 500);
    assert.equal(res.body.booking.phase, "upcoming");

    const details = await guest.get(`/api/bookings/${bookingId}`);
    assert.equal(details.status, 200);
    assert.equal(details.body.viewerIsHost, false);
    assert.equal(details.body.booking.isCancellable, true);
  });

  it("prevents double-booking overlapping dates", async () => {
    const overlap = await book(otherGuest, listingId, isoFromToday(12), isoFromToday(15));
    assert.equal(overlap.status, 409);
    assert.equal(overlap.body.error, "Sorry, some of those dates were just booked. Please pick different dates.");
    const backToBack = await book(otherGuest, listingId, isoFromToday(13), isoFromToday(15));
    assert.equal(backToBack.status, 201);
    assert.equal(await Booking.countDocuments({ status: "confirmed" }), 2);
  });

  it("hides booked listings from date-filtered search", async () => {
    assert.equal((await searchTitles(request(app), `q=naggar&checkIn=${isoFromToday(11)}&checkOut=${isoFromToday(12)}`)).length, 0);
    assert.equal((await searchTitles(request(app), `q=naggar&checkIn=${isoFromToday(20)}&checkOut=${isoFromToday(22)}`)).length, 1);
  });

  it("keeps bookings private to the guest and host", async () => {
    const stranger = await signup(app, "Nosy Neighbour", "nosy@example.com");
    assert.equal((await stranger.get(`/api/bookings/${bookingId}`)).status, 404);
  });

  it("shows the trip to the guest and the reservation to the host", async () => {
    const trips = await guest.get("/api/trips");
    assert.equal(trips.body.upcoming[0].listing.title, "Quiet orchard cottage near Naggar");
    const dashboard = await host.get("/api/host");
    const guests = dashboard.body.reservations.upcoming.map((booking) => booking.guest.name);
    assert.deepEqual(guests.sort(), ["Isha Menon", "Kabir Sethi"]);
    assert.equal(dashboard.body.stats.upcomingReservations, 2);
    assert.equal(dashboard.body.listings[0].upcomingCount, 2);
  });

  it("won't delete a listing that has upcoming reservations", async () => {
    const res = await send(host, "delete", `/api/listings/${listingId}`);
    assert.equal(res.status, 409);
    assert.match(res.body.error, /has upcoming reservations/);
    assert.ok(await Listing.exists({ _id: listingId, status: "active" }));
  });

  it("lets the guest cancel an upcoming stay, which frees the dates", async () => {
    const res = await send(guest, "patch", `/api/bookings/${bookingId}/cancel`);
    assert.equal(res.body.booking.status, "cancelled");
    assert.equal(res.body.booking.cancelledBy, "guest");

    const rebook = await book(otherGuest, listingId, isoFromToday(10), isoFromToday(12));
    assert.equal(rebook.status, 201);
  });

  it("only accepts reviews from guests with a completed stay", async () => {
    const review = { review: { rating: 5, comment: "Lovely orchard, quiet nights." } };

    const early = await send(guest, "post", `/api/listings/${listingId}/reviews`, review);
    assert.equal(early.status, 403);
    assert.equal(early.body.error, "You can review a place after completing a stay there.");

    const listing = await Listing.findById(listingId);
    await Booking.create({
      listing: listing._id,
      guest: (await Booking.findById(bookingId)).guest,
      host: listing.host,
      checkIn: addDays(today(), -10),
      checkOut: addDays(today(), -7),
      guests: 2,
      nights: 3,
      pricePerNight: 4000,
      cleaningFee: 500,
      totalPrice: 12500,
    });
    assert.equal((await guest.get(`/api/listings/${listingId}`)).body.canReview, true);

    const posted = await send(guest, "post", `/api/listings/${listingId}/reviews`, review);
    assert.equal(posted.status, 201);
    const updated = await Listing.findById(listingId);
    assert.equal(updated.ratingAverage, 5);
    assert.equal(updated.reviewCount, 1);

    const again = await send(guest, "post", `/api/listings/${listingId}/reviews`, review);
    assert.equal(again.status, 403);
    assert.equal(await Review.countDocuments(), 1);
  });

  it("lets the host pause a listing, hiding it from search and blocking bookings", async () => {
    const res = await send(host, "patch", `/api/listings/${listingId}/status`, { status: "paused" });
    assert.equal(res.body.listing.status, "paused");
    assert.equal((await searchTitles(request(app), "q=naggar")).length, 0);

    const blocked = await book(guest, listingId, isoFromToday(40), isoFromToday(42));
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.error, "This place isn't accepting bookings right now.");
  });

  it("logs users in and out with email and password", async () => {
    const agent = request.agent(app);
    const bad = await send(agent, "post", "/api/auth/login", { email: "kabir@example.com", password: "wrong-password" });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.error, "Incorrect email or password.");

    const empty = await send(agent, "post", "/api/auth/login", { email: "", password: "" });
    assert.equal(empty.body.error, "Please enter your email and password.");

    const good = await send(agent, "post", "/api/auth/login", { email: "KABIR@example.com", password: "correct-horse-1" });
    assert.equal(good.body.user.name, "Kabir Sethi");
    assert.equal((await agent.get("/api/trips")).status, 200);

    await send(agent, "post", "/api/auth/logout");
    assert.equal((await agent.get("/api/trips")).status, 401);
  });

  it(
    "serves the React app for page URLs and a 404 for unknown pages",
    { skip: !fs.existsSync(path.join(__dirname, "../../../frontend/dist/index.html")) },
    async () => {
      const page = await request(app).get(`/listings/${listingId}`);
      assert.equal(page.status, 200);
      assert.match(page.text, /<div id="root"><\/div>/);
      assert.equal((await request(app).get("/definitely-not-a-page")).status, 404);
      const api = await request(app).get("/api/definitely-not-an-endpoint");
      assert.equal(api.body.error, "We couldn't find the page you were looking for.");
    }
  );
});
