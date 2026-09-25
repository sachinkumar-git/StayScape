const { CURRENCIES, CURRENCY_MAP } = require("../constants/currency");
const { PROPERTY_TYPES, AMENITIES, SORT_OPTIONS, MAX_PHOTOS } = require("../constants/listing");
const { MAX_GUESTS, MAX_NIGHTS } = require("../constants/booking");
const { currentCurrency } = require("../utils/currency");

const serializeUser = (user) => ({ _id: user._id, name: user.name, email: user.email });

function show(req, res) {
  res.json({
    user: req.user ? serializeUser(req.user) : null,
    csrfToken: req.session.csrfToken,
    currency: CURRENCY_MAP[currentCurrency(req)],
    currencies: CURRENCIES,
    wishlist: (req.user?.wishlist || []).map(String),
    meta: {
      propertyTypes: PROPERTY_TYPES,
      amenities: AMENITIES,
      sortOptions: SORT_OPTIONS,
      maxPhotos: MAX_PHOTOS,
      maxGuests: MAX_GUESTS,
      maxNights: MAX_NIGHTS,
    },
  });
}

function setCurrency(req, res) {
  req.session.currency = req.body.currency;
  res.json({ currency: CURRENCY_MAP[req.body.currency] });
}

module.exports = { show, setCurrency, serializeUser };
