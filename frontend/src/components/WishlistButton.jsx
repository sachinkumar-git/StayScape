import { useState } from "react";
import { useSession } from "../context/SessionContext.jsx";
import { useFlash } from "../context/FlashContext.jsx";
import { useLoginRedirect } from "../hooks/useLoginRedirect.js";
import { api } from "../lib/api.js";

export default function WishlistButton({ listing, variant }) {
  const { user, wishlist, setWishlisted } = useSession();
  const { flash } = useFlash();
  const goToLogin = useLoginRedirect();
  const [busy, setBusy] = useState(false);
  const saved = wishlist.includes(listing._id);

  async function toggle(event) {
    event.preventDefault();
    if (!user) return goToLogin();
    setBusy(true);
    try {
      const result = await api(`/wishlist/${listing._id}`, { method: "POST" });
      setWishlisted(listing._id, result.saved);
    } catch (error) {
      flash("error", error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="wishlist-form" onSubmit={toggle}>
      <button
        className={`wishlist-btn ${variant ? `wishlist-btn-${variant}` : ""} ${saved ? "is-saved" : ""}`}
        type="submit"
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved stays" : "Save to your wishlist"}
      >
        <i className={`${saved ? "fa-solid" : "fa-regular"} fa-heart`} aria-hidden="true"></i>
        {variant === "labelled" && <span>{saved ? "Saved" : "Save"}</span>}
      </button>
    </form>
  );
}
