const wishlistService = require("../services/wishlistService");

async function index(req, res) {
  res.json({ listings: await wishlistService.listSaved(req.user) });
}

async function toggle(req, res) {
  res.json({ saved: await wishlistService.toggle(req.user, req.listing._id) });
}

module.exports = { index, toggle };
