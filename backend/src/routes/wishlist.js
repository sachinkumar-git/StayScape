const express = require("express");
const wishlist = require("../controllers/wishlistController");
const { requireAuth, validateObjectId, loadListing } = require("../middleware/auth");

const router = express.Router();

router.param("id", validateObjectId);

router.get("/", requireAuth, wishlist.index);
router.post("/:id", requireAuth, loadListing, wishlist.toggle);

module.exports = router;
