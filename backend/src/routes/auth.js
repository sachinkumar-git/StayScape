const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../controllers/authController");
const schemas = require("../validators");
const env = require("../config/env");
const { validateBody } = require("../middleware/validate");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  handler(req, res) {
    res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
  },
});

router.post("/signup", authLimiter, validateBody(schemas.signup), auth.signup);
router.post("/login", authLimiter, validateBody(schemas.login, { message: "Please enter your email and password." }), auth.login);
router.post("/logout", auth.logout);

module.exports = router;
