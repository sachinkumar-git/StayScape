const express = require("express");
const authRoutes = require("./auth");
const listingRoutes = require("./listings");
const bookingRoutes = require("./bookings");
const wishlistRoutes = require("./wishlist");
const schemas = require("../validators");
const session = require("../controllers/sessionController");
const { validateBody } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { notFound } = require("../middleware/errorHandler");
const { trips } = require("../controllers/bookingController");
const { dashboard } = require("../controllers/hostController");

const router = express.Router();

router.get("/session", session.show);
router.post("/preferences/currency", validateBody(schemas.currency), session.setCurrency);
router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/bookings", bookingRoutes);
router.use("/wishlist", wishlistRoutes);
router.get("/trips", requireAuth, trips);
router.get("/host", requireAuth, dashboard);
router.use(notFound);

module.exports = router;
