const DAY_MS = 24 * 60 * 60 * 1000;
const INR = { code: "INR", locale: "en-IN", rate: 1 };
const formatters = new Map();

function formatterFor(currency) {
  if (!formatters.has(currency.code)) {
    formatters.set(
      currency.code,
      new Intl.NumberFormat(currency.locale, { style: "currency", currency: currency.code, maximumFractionDigits: 0 })
    );
  }
  return formatters.get(currency.code);
}

export const formatPrice = (amount, currency = INR) => formatterFor(currency).format((amount || 0) * currency.rate);

export const formatBasePrice = (amount) => formatPrice(amount, INR);

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export const firstName = (name = "") => name.split(" ")[0];

export function formatDate(date, options = {}) {
  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatRange(checkIn, checkOut) {
  const sameYear = new Date(checkIn).getUTCFullYear() === new Date(checkOut).getUTCFullYear();
  const start = formatDate(checkIn, sameYear ? { year: undefined } : {});
  return `${start} – ${formatDate(checkOut)}`;
}

export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export const parseISODate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value || "") ? new Date(`${value}T00:00:00Z`) : null);

export const addDaysISO = (value, days) => new Date(parseISODate(value).getTime() + days * DAY_MS).toISOString().slice(0, 10);

export const nightsBetween = (start, end) => Math.round((end - start) / DAY_MS);
