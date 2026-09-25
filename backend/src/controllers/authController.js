const passport = require("passport");
const User = require("../models/User");
const { serializeUser } = require("./sessionController");

async function signup(req, res, next) {
  const { name, email, password } = req.body;
  let user;
  try {
    user = await User.register(new User({ name, email }), password);
  } catch (err) {
    if (err.name !== "UserExistsError") throw err;
    return res.status(400).json({ error: err.message, errors: { email: err.message } });
  }

  return req.login(user, (err) => {
    if (err) return next(err);
    return res.status(201).json({ user: serializeUser(user) });
  });
}

function login(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Incorrect email or password." });
    return req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.json({ user: serializeUser(user) });
    });
  })(req, res, next);
}

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    return res.json({ ok: true });
  });
}

module.exports = { signup, login, logout };
