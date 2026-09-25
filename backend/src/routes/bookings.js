const express = require("express");
const bookings = require("../controllers/bookingController");
const { requireAuth, validateObjectId, loadBookingForParticipant } = require("../middleware/auth");

const router = express.Router();

router.param("id", validateObjectId);

router.get("/:id", requireAuth, loadBookingForParticipant, bookings.show);
router.patch("/:id/cancel", requireAuth, loadBookingForParticipant, bookings.cancel);

module.exports = router;
