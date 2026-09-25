import { useSession } from "../../context/SessionContext.jsx";
import { useFlash } from "../../context/FlashContext.jsx";
import { api } from "../../lib/api.js";

export default function CurrencyMenu() {
  const { currency, currencies, refresh } = useSession();
  const { flash } = useFlash();

  async function choose(event, option) {
    event.preventDefault();
    try {
      await api("/preferences/currency", { method: "POST", body: { currency: option.code } });
      await refresh();
      window.scrollTo(0, 0);
      flash("success", `Prices are now shown in ${option.label}s.`);
    } catch (error) {
      flash("error", error.message);
    }
  }

  return (
    <div className="dropdown currency-menu">
      <button className="currency-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label={`Currency: ${currency.code}`}>
        <i className="fa-solid fa-globe" aria-hidden="true"></i>
        <span>{currency.code}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
      <div className="dropdown-menu dropdown-menu-end">
        <h6 className="dropdown-header">Show prices in</h6>
        {currencies.map((option) => (
          <form key={option.code} onSubmit={(event) => choose(event, option)}>
            <button className={`dropdown-item currency-option ${option.code === currency.code ? "active" : ""}`} type="submit">
              <span className="currency-symbol">{option.symbol}</span>
              <span>{option.label}</span>
              <span className="ms-auto text-secondary small">{option.code}</span>
            </button>
          </form>
        ))}
        <p className="currency-note">Converted at fixed reference rates. Bookings are charged in INR.</p>
      </div>
    </div>
  );
}
