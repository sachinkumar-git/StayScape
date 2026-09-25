import { pluralize } from "../lib/format.js";

export default function RatingBadge({ average, count, showCount = false }) {
  if (count === 0) return <span className="rating-badge rating-badge-new">New</span>;

  return (
    <span className="rating-badge" title={`${average.toFixed(2)} average from ${count} ${count === 1 ? "review" : "reviews"}`}>
      <i className="fa-solid fa-star" aria-hidden="true"></i>
      {average.toFixed(1)}
      {showCount && <span className="rating-count">{`· ${pluralize(count, "review")}`}</span>}
    </span>
  );
}
