const env = require("../src/config/env");
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const User = require("../src/models/User");
const Listing = require("../src/models/Listing");
const Booking = require("../src/models/Booking");
const Review = require("../src/models/Review");
const { refreshListingRating } = require("../src/services/reviewService");
const { today, addDays } = require("../src/utils/dates");
const data = require("./seed-data");

const DEMO_PASSWORD = process.env.SEED_PASSWORD || "stayscape-demo";

function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(20260924);
const between = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (items) => items[Math.floor(random() * items.length)];

async function createUsers() {
  const users = {};
  for (const person of [...data.hosts, ...data.guests]) {
    users[person.key] = await User.register(new User({ name: person.name, email: person.email }), DEMO_PASSWORD);
  }
  return users;
}

function createListings(users) {
  return Listing.insertMany(
    data.listings.map(({ host, coordinates, images, ...fields }) => ({
      ...fields,
      host: users[host]._id,
      geometry: { type: "Point", coordinates },
      images: images.map((url) => ({ url, provider: "external" })),
    }))
  );
}

function bookingDoc(listing, guest, checkIn, nights, extra = {}) {
  const guestsCount = Math.min(listing.maxGuests, between(1, 4));
  return {
    listing: listing._id,
    guest: guest._id,
    host: listing.host,
    checkIn,
    checkOut: addDays(checkIn, nights),
    guests: guestsCount,
    nights,
    pricePerNight: listing.pricePerNight,
    cleaningFee: listing.cleaningFee,
    totalPrice: listing.pricePerNight * nights + listing.cleaningFee,

    createdAt: addDays(checkIn, -between(7, 45)),
    ...extra,
  };
}

function planBookings(listings, users) {
  const guestPool = data.guests.map((g) => users[g.key]);
  const bookings = [];
  const now = today();

  listings.forEach((listing, index) => {
    let cursor = addDays(now, -between(3, 12));
    const pastCount = between(2, 4);
    for (let i = 0; i < pastCount; i++) {
      const nights = between(2, 5);
      const checkIn = addDays(cursor, -nights);
      bookings.push(bookingDoc(listing, pick(guestPool), checkIn, nights));
      cursor = addDays(checkIn, -between(6, 30));
    }

    if (index % 3 !== 2) {
      let start = addDays(now, between(4, 20));
      const upcomingCount = between(1, 2);
      for (let i = 0; i < upcomingCount; i++) {
        const nights = between(2, 4);
        bookings.push(bookingDoc(listing, pick(guestPool), start, nights));
        start = addDays(start, nights + between(5, 25));
      }
    }

    if (index % 4 === 1) {
      const checkIn = addDays(now, between(60, 80));
      bookings.push(
        bookingDoc(listing, pick(guestPool), checkIn, 3, {
          status: "cancelled",
          cancelledBy: index % 8 === 1 ? "host" : "guest",
          cancelledAt: addDays(now, -between(1, 5)),
        })
      );
    }
  });

  const priya = users.priya;
  const byTitle = (text) => listings.find((l) => l.title.includes(text));
  bookings.push(
    bookingDoc(byTitle("Solang Valley"), priya, addDays(now, 56), 4),
    bookingDoc(byTitle("Dal Lake"), priya, addDays(now, 95), 3),
    bookingDoc(byTitle("Kodaikanal"), priya, addDays(now, -150), 3, { reviewable: true }),
    bookingDoc(byTitle("Palolem"), priya, addDays(now, 120), 2, {
      status: "cancelled",
      cancelledBy: "guest",
      cancelledAt: addDays(now, -2),
    })
  );

  assertNoOverlaps(bookings);
  return bookings;
}

function assertNoOverlaps(bookings) {
  const confirmed = bookings.filter((b) => b.status !== "cancelled");
  for (const a of confirmed) {
    for (const b of confirmed) {
      if (a !== b && a.listing.equals(b.listing) && a.checkIn < b.checkOut && b.checkIn < a.checkOut) {
        throw new Error(`Seed data has overlapping bookings on listing ${a.listing}`);
      }
    }
  }
}

async function createReviews(bookings) {
  const now = today();
  const reviews = [];
  for (const booking of bookings) {
    const completed = booking.status === "confirmed" && booking.checkOut <= now;

    if (!completed || booking.reviewable || random() < 0.2) continue;
    const [rating, comment] = pick(data.reviewComments);
    reviews.push({
      listing: booking.listing,
      author: booking.guest,
      booking: booking._id,
      rating,
      comment,
      createdAt: addDays(booking.checkOut, between(1, 6)),
    });
  }
  return Review.insertMany(reviews);
}

async function seed() {
  if (env.isProduction && !process.argv.includes("--force")) {
    throw new Error("Refusing to seed a production database (pass --force if you really mean it).");
  }

  const connection = await connectDatabase(env.mongoUrl);
  console.log(`Seeding ${connection.name}…`);

  await Promise.all([User.deleteMany({}), Listing.deleteMany({}), Booking.deleteMany({}), Review.deleteMany({})]);
  await Promise.all([User.syncIndexes(), Listing.syncIndexes(), Booking.syncIndexes(), Review.syncIndexes()]);

  const users = await createUsers();
  const listings = await createListings(users);
  const planned = planBookings(listings, users);
  const inserted = await Booking.insertMany(planned.map(({ reviewable, ...doc }) => doc));
  inserted.forEach((doc, i) => {
    if (planned[i].reviewable) doc.reviewable = true;
  });
  const reviews = await createReviews(inserted);
  await Promise.all(listings.map((l) => refreshListingRating(l._id)));

  console.log(
    `Created ${Object.keys(users).length} users, ${listings.length} listings, ` +
    `${inserted.length} bookings and ${reviews.length} reviews.`
  );
  console.log(`Demo accounts use the password "${DEMO_PASSWORD}" (e.g. priya@example.com, ananya@example.com).`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
