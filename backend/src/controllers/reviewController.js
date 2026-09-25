const reviewService = require("../services/reviewService");

async function create(req, res) {
  const review = await reviewService.createReview(req.listing, req.user, req.body.review);
  res.status(201).json({ review });
}

async function destroy(req, res) {
  await reviewService.deleteReview(req.review);
  res.json({ ok: true });
}

module.exports = { create, destroy };
