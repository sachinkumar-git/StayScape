import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Collapse } from "bootstrap";
import { useSession } from "../../context/SessionContext.jsx";
import { useFlash } from "../../context/FlashContext.jsx";
import { api } from "../../lib/api.js";
import { initials } from "../../lib/format.js";
import CurrencyMenu from "./CurrencyMenu.jsx";

export default function Navbar() {
  const { user, refresh } = useSession();
  const { flash, redirect } = useFlash();
  const { pathname } = useLocation();
  const collapseRef = useRef(null);

  useEffect(() => {
    const element = collapseRef.current;
    if (element?.classList.contains("show")) Collapse.getOrCreateInstance(element, { toggle: false }).hide();
  }, [pathname]);

  const onHostPage = pathname === "/host" || pathname === "/listings/new" || pathname.endsWith("/edit");
  const onListingPage = pathname === "/listings" || (pathname.startsWith("/listings/") && !onHostPage);
  const links = [
    { to: "/listings", label: "Explore", active: onListingPage },
    { to: "/trips", label: "Trips", active: pathname === "/trips" || pathname.startsWith("/bookings") },
    { to: "/host", label: "Hosting", active: onHostPage },
    { to: "/about", label: "About", active: pathname === "/about" },
  ];

  async function logout(event) {
    event.preventDefault();
    try {
      await api("/auth/logout", { method: "POST" });
      redirect("/listings", "success", "You've been logged out.");
      await refresh();
    } catch (error) {
      flash("error", error.message);
    }
  }

  return (
    <header className="site-header">
      <nav className="navbar navbar-expand-lg container-xl" aria-label="Main">
        <Link className="brand" to="/listings">
          <span className="brand-mark" aria-hidden="true"><i className="fa-solid fa-house-chimney"></i></span>
          <span className="brand-name">StayScape</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <div className="collapse navbar-collapse" id="mainNav" ref={collapseRef}>
          <ul className="navbar-nav main-links mx-lg-auto">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <Link className={`nav-link ${link.active ? "active" : ""}`} to={link.to} aria-current={link.active ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <CurrencyMenu />
            <span className="nav-divider" aria-hidden="true"></span>
            <Link className={`icon-link-btn ${pathname === "/wishlist" ? "active" : ""}`} to="/wishlist" aria-label="Saved stays" title="Saved stays">
              <i className="fa-regular fa-heart"></i>
              <span className="d-lg-none ms-2">Saved stays</span>
            </Link>

            {user ? (
              <div className="dropdown">
                <button className="user-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">
                  <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
                  <i className="fa-solid fa-chevron-down user-menu-caret" aria-hidden="true"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="dropdown-header">
                    <div className="fw-semibold text-body">{user.name}</div>
                    <div className="small">{user.email}</div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/trips"><i className="fa-solid fa-suitcase-rolling"></i>Your trips</Link></li>
                  <li><Link className="dropdown-item" to="/wishlist"><i className="fa-regular fa-heart"></i>Saved stays</Link></li>
                  <li><Link className="dropdown-item" to="/host"><i className="fa-solid fa-chart-simple"></i>Host dashboard</Link></li>
                  <li><Link className="dropdown-item" to="/listings/new"><i className="fa-solid fa-plus"></i>List a new place</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <form onSubmit={logout}>
                      <button className="dropdown-item" type="submit"><i className="fa-solid fa-arrow-right-from-bracket"></i>Log out</button>
                    </form>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link className="nav-link nav-login" to="/login">Log in</Link>
                <Link className="btn btn-primary btn-sm nav-signup" to="/signup">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
