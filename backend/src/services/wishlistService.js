const User = require("../models/User");
const Listing = require("../models/Listing");

async function toggle(user, listingId) {
  const saved = !user.hasSaved(listingId);
  const update = saved ? { $addToSet: { wishlist: listingId } } : { $pull: { wishlist: listingId } };
  await User.updateOne({ _id: user._id }, update);
  return saved;
}

function listSaved(user) {
  return Listing.find({ _id: { $in: user.wishlist }, status: "active" }).sort({ ratingAverage: -1 }).lean();
}

module.exports = { toggle, listSaved };
