import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [local, setLocal] = useState({ locationKey: null, message: null, count: 0 });
  const [dismissed, setDismissed] = useState(() => new Set());

  const messages = useMemo(() => {
    const current =
      local.locationKey === location.key
        ? [local.message]
        : (location.state?.flash || []).map((message, index) => ({ ...message, id: `${location.key}-${index}` }));
    return current.filter((message) => !dismissed.has(message.id));
  }, [location.key, location.state, local, dismissed]);

  useEffect(() => {
    const historyState = window.history.state;
    if (!historyState?.usr?.flash) return;
    const { flash: _shown, ...rest } = historyState.usr;
    window.history.replaceState({ ...historyState, usr: rest }, "");
  }, [location.key]);

  const flash = useCallback(
    (type, message) => {
      setLocal((current) => ({
        locationKey: location.key,
        message: { type, message, id: `${location.key}-local-${(current.count || 0) + 1}` },
        count: (current.count || 0) + 1,
      }));
    },
    [location.key]
  );

  const dismiss = useCallback((id) => setDismissed((current) => new Set(current).add(id)), []);

  const redirect = useCallback(
    (to, type, message, state = {}) => navigate(to, { state: { ...state, flash: [{ type, message }] } }),
    [navigate]
  );

  const value = useMemo(() => ({ messages, flash, dismiss, redirect }), [messages, flash, dismiss, redirect]);
  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export const useFlash = () => useContext(FlashContext);
