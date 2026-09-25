const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/User");

function configurePassport() {
  passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  return passport;
}

module.exports = configurePassport;
