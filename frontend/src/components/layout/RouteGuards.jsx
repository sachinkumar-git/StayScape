import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../../context/SessionContext.jsx";

export function RequireAuth() {
  const { user } = useSession();
  const location = useLocation();
  if (user) return <Outlet />;
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location, flash: [{ type: "error", message: "Please log in to continue." }] }}
    />
  );
}
