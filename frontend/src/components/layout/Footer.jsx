import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-xl footer-inner">
        <div className="footer-brand">
          <Link className="brand brand-sm" to="/listings">
            <span className="brand-mark" aria-hidden="true"><i className="fa-solid fa-house-chimney"></i></span>
            <span className="brand-name">StayScape</span>
          </Link>
          <p>Homes, cabins and villas across India, booked directly with their hosts.</p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/listings">Explore</Link>
          <Link to="/listings/new">Host your place</Link>
          <Link to="/wishlist">Saved stays</Link>
          <Link to="/about">About</Link>
        </nav>
        <p className="footer-copy">&copy; {new Date().getFullYear()} StayScape</p>
      </div>
    </footer>
  );
}
