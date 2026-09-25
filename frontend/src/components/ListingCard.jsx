import { useState } from "react";
import { Link } from "react-router";
import { useSession } from "../context/SessionContext.jsx";
import { formatPrice, pluralize } from "../lib/format.js";
import RatingBadge from "./RatingBadge.jsx";
import WishlistButton from "./WishlistButton.jsx";

export default function ListingCard({ listing, linkQuery }) {
  const { currency, meta } = useSession();
  const [current, setCurrent] = useState(0);
  const photos = listing.images;
  const href = `/listings/${listing._id}${linkQuery ? `?${linkQuery}` : ""}`;
  const place = `${listing.location}, ${listing.country}`;
  const typeLabel = meta.propertyTypes.find((type) => type.key === listing.propertyType).label;

  const step = (direction) => setCurrent((index) => (index + direction + photos.length) % photos.length);

  return (
    <article className="listing-card">
      <div className="listing-card-media">
        <Link className="listing-card-photos" to={href} tabIndex={-1} aria-hidden="true">
          {photos.map((photo, index) => (
            <img key={photo.url} className={index === current ? "is-active" : ""} src={photo.url} alt="" loading="lazy" decoding="async" />
          ))}
        </Link>
        <span className="listing-card-badge">{typeLabel}</span>
        <WishlistButton listing={listing} />
        {photos.length > 1 && (
          <>
            <button className="card-nav card-nav-prev" type="button" onClick={() => step(-1)} aria-label={`Previous photo of ${listing.title}`}>
              <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button className="card-nav card-nav-next" type="button" onClick={() => step(1)} aria-label={`Next photo of ${listing.title}`}>
              <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </>
        )}
      </div>

      <Link className="listing-card-body" to={href}>
        <div className="listing-card-heading">
          <h3 className="listing-card-title" title={place}>{place}</h3>
          <RatingBadge average={listing.ratingAverage} count={listing.reviewCount} />
        </div>
        <p className="listing-card-subtitle">{listing.title}</p>
        <p className="listing-card-meta">
          <span><i className="fa-regular fa-user" aria-hidden="true"></i>{pluralize(listing.maxGuests, "guest")}</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span><i className="fa-solid fa-bed" aria-hidden="true"></i>{pluralize(listing.bedrooms, "bedroom")}</span>
        </p>
        <p className="listing-card-price"><strong>{formatPrice(listing.pricePerNight, currency)}</strong> night</p>
      </Link>
    </article>
  );
}
