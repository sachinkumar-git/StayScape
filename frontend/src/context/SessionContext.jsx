import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setCsrfToken } from "../lib/api.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);

  const apply = useCallback((data) => {
    setCsrfToken(data.csrfToken);
    setSession(data);
    return data;
  }, []);

  const refresh = useCallback(() => api("/session").then(apply), [apply]);

  useEffect(() => {
    api("/session").then(apply);
  }, [apply]);

  const setWishlisted = useCallback((listingId, saved) => {
    setSession((current) => ({
      ...current,
      wishlist: saved ? [...current.wishlist, listingId] : current.wishlist.filter((id) => id !== listingId),
    }));
  }, []);

  const value = useMemo(() => session && { ...session, refresh, setWishlisted }, [session, refresh, setWishlisted]);

  if (!value) return null;
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
