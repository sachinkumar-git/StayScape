const CURRENCIES = [
  { code: "INR", label: "Indian rupee", symbol: "₹", locale: "en-IN", rate: 1 },
  { code: "USD", label: "US dollar", symbol: "$", locale: "en-US", rate: 0.012 },
  { code: "EUR", label: "Euro", symbol: "€", locale: "de-DE", rate: 0.011 },
  { code: "GBP", label: "British pound", symbol: "£", locale: "en-GB", rate: 0.0094 },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

module.exports = {
  CURRENCIES,
  CURRENCY_MAP,
  CURRENCY_CODES: CURRENCIES.map((c) => c.code),
  BASE_CURRENCY: "INR",
};
