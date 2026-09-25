import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";

export function useLoginRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    () =>
      navigate("/login", {
        state: { from: location, flash: [{ type: "error", message: "Please log in to continue." }] },
      }),
    [navigate, location]
  );
}
