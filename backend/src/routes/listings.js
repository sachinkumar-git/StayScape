const express = require("express");
const listings = require("../controllers/listingController");
const bookings = require("../controllers/bookingController");
const reviews = require("../controllers/reviewController");
const schemas = require("../validators");
const { validateBody } = require("../middleware/validate");
const { listingImageUpload } = require("../middleware/upload");
const {
  requireAuth,
  validateObjectId,
  loadListing,
  requireListingHost,
  loadOwnReview,
} = require("../middleware/auth");

const router = express.Router();

router.param("id", validateObjectId);
router.param("reviewId", validateObjectId);

const asHost = [requireAuth, loadListing, requireListingHost];

router
  .route("/")
  .get(listings.index)
  .post(requireAuth, listingImageUpload, validateBody(schemas.listing), listings.create);

router
  .route("/:id")
  .get(loadListing, listings.show)
  .put(asHost, listingImageUpload, validateBody(schemas.listing), listings.update)
  .delete(asHost, listings.destroy);

router.patch("/:id/status", asHost, validateBody(schemas.listingStatus), listings.updateStatus);
router.post("/:id/bookings", requireAuth, loadListing, validateBody(schemas.booking), bookings.create);
router.post("/:id/reviews", requireAuth, loadListing, validateBody(schemas.review), reviews.create);
router.delete("/:id/reviews/:reviewId", requireAuth, loadListing, loadOwnReview, reviews.destroy);

module.exports = router;
