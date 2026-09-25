const multer = require("multer");
const { verifyCsrfToken } = require("./csrf");
const { MAX_PHOTOS } = require("../constants/listing");

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TYPE_ERROR = "Photos must be JPG, PNG or WebP images.";

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: MAX_PHOTOS, fields: 60 },
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
    err.message = TYPE_ERROR;
    return cb(err);
  },
}).array("images", MAX_PHOTOS);

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: "Each photo must be 5 MB or smaller.",
  LIMIT_FILE_COUNT: `You can upload up to ${MAX_PHOTOS} photos.`,
};

function handleUpload(req, res, next) {
  parser(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      req.uploadError =
        err.message === TYPE_ERROR
          ? TYPE_ERROR
          : UPLOAD_ERRORS[err.code] || `You can upload up to ${MAX_PHOTOS} photos.`;
      req.body = req.body || {};
      req.files = [];
      return next();
    }
    return next(err);
  });
}

const listingImageUpload = [handleUpload, verifyCsrfToken];

module.exports = { listingImageUpload };
