const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError(404, "We couldn't find the page you were looking for."));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err instanceof AppError ? err.message : "Something went wrong on our side. Please try again.";

  if (err.name === "CastError") {
    statusCode = 404;
    message = "We couldn't find what you were looking for.";
  } else if (statusCode < 500 && !(err instanceof AppError)) {
    message = "That request couldn't be processed.";
  }

  if (statusCode >= 500) console.error(err);
  if (res.headersSent) return next(err);

  return res.status(statusCode).json({ error: message });
}

module.exports = { notFound, errorHandler };
