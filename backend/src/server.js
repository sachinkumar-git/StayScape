const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const passport = require("passport");

const env = require("./config/env");
const configurePassport = require("./config/passport");
const securityHeaders = require("./config/security");
const { issueCsrfToken, verifyCsrf } = require("./middleware/csrf");
const { errorHandler } = require("./middleware/errorHandler");
const apiRoutes = require("./routes");

const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
const BACKEND_PUBLIC = path.join(__dirname, "..", "public");

const CLIENT_ROUTES = [
  /^\/listings\/?$/,
  /^\/listings\/new\/?$/,
  /^\/listings\/[0-9a-f]{24}(\/edit)?\/?$/,
  /^\/bookings\/[0-9a-f]{24}\/?$/,
  /^\/(trips|host|wishlist|about|login|signup)\/?$/,
];

function serveClient(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();

  const indexFile = path.join(FRONTEND_DIST, "index.html");

  if (!fs.existsSync(indexFile)) {
    return res
      .status(404)
      .type("text")
      .send(
        "The frontend has not been built. Run `npm run build`, or use `npm run dev`.",
      );
  }

  const known = CLIENT_ROUTES.some((pattern) => pattern.test(req.path));

  return res.status(known ? 200 : 404).sendFile(indexFile);
}

function createApp({ mongoClient }) {
  const app = express();

  if (env.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(securityHeaders());

  app.use(
    express.static(BACKEND_PUBLIC, {
      maxAge: env.isProduction ? "7d" : 0,
    }),
  );

  app.use(
    express.static(FRONTEND_DIST, {
      index: false,
      maxAge: env.isProduction ? "7d" : 0,
    }),
  );

  app.use(express.json({ limit: "100kb" }));

  app.use(
    session({
      name: "stayscape.sid",
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: mongoClient,
        touchAfter: 24 * 60 * 60,
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  configurePassport();

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/", (req, res) => res.redirect("/listings"));

  app.use("/api", issueCsrfToken, verifyCsrf, apiRoutes);

  app.use(serveClient);

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
