const OPTIONS = {
  abortEarly: false,
  stripUnknown: true,
  errors: { wrap: { label: false } },
  messages: { "string.empty": "{#label} is required" },
};

function toFieldErrors(details) {
  const errors = {};
  for (const detail of details) {
    const key = detail.path.join(".");
    if (!errors[key]) errors[key] = detail.message;
  }
  return errors;
}

function validateBody(schema, { message } = {}) {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body || {}, OPTIONS);
    const errors = error ? toFieldErrors(error.details) : {};
    if (req.uploadError) errors.images = req.uploadError;

    if (Object.keys(errors).length === 0) {
      req.body = value;
      return next();
    }
    return res.status(400).json({ error: message || Object.values(errors)[0], errors });
  };
}

module.exports = { validateBody };
