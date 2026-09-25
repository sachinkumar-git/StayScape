const { CURRENCY_MAP, BASE_CURRENCY } = require("../constants/currency");

function currentCurrency(req) {
  const code = req.session?.currency;
  return CURRENCY_MAP[code] ? code : BASE_CURRENCY;
}

module.exports = { currentCurrency };
