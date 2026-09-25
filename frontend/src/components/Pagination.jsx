import { Link } from "react-router";

export default function Pagination({ page, pages, hrefFor }) {
  if (pages <= 1) return null;

  return (
    <nav className="pagination-wrap" aria-label="Search results pages">
      <ul className="pagination">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <Link className="page-link" to={hrefFor(page - 1)} aria-label="Previous page"><i className="fa-solid fa-chevron-left"></i></Link>
        </li>
        {Array.from({ length: pages }, (_, index) => index + 1).map((p) => (
          <li className={`page-item ${p === page ? "active" : ""}`} key={p}>
            <Link className="page-link" to={hrefFor(p)} aria-current={p === page ? "page" : undefined}>{p}</Link>
          </li>
        ))}
        <li className={`page-item ${page === pages ? "disabled" : ""}`}>
          <Link className="page-link" to={hrefFor(page + 1)} aria-label="Next page"><i className="fa-solid fa-chevron-right"></i></Link>
        </li>
      </ul>
    </nav>
  );
}
