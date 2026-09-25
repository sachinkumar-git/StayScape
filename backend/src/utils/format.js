const { CURRENCY_MAP, BASE_CURRENCY } = require("../constants/currency");

const toBaseCurrency = (amount, code = BASE_CURRENCY) => Math.round(amount / CURRENCY_MAP[code].rate);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { toBaseCurrency, escapeRegex };
