import { Link } from "react-router";

export default function EmptyState({ icon, title, text, actionHref, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true"><i className={`fa-solid ${icon}`}></i></div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="text-secondary mb-3">{text}</p>
      {actionHref && <Link className="btn btn-outline-dark btn-sm" to={actionHref}>{actionLabel}</Link>}
    </div>
  );
}
