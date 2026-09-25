const crypto = require("crypto");
const AppError = require("../utils/AppError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function issueCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }
  next();
}

function tokensMatch(expected, received) {
  if (typeof received !== "string" || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function checkToken(req, res, next) {
  const expected = req.session.csrfToken;
  const received = req.body?._csrf || req.get("x-csrf-token");
  if (!expected || !tokensMatch(expected, received)) {
    return next(new AppError(403, "Your session has expired. Please refresh the page and try again."));
  }
  return next();
}

const MULTIPART_ROUTES = [
  { method: "POST", path: /^\/api\/listings\/?$/ },
  { method: "PUT", path: /^\/api\/listings\/[0-9a-f]{24}\/?$/ },
];

function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.is("multipart/form-data")) {
    const allowed = MULTIPART_ROUTES.some((r) => r.method === req.method && r.path.test(req.originalUrl.split("?")[0]));
    return allowed ? next() : next(new AppError(400, "That request couldn't be processed."));
  }
  return checkToken(req, res, next);
}

module.exports = { issueCsrfToken, verifyCsrf, verifyCsrfToken: checkToken };
