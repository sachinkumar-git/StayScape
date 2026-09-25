import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api.js";

export function useApi(path, refreshKey) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const key = `${path}|${refreshKey}|${version}`;

  useEffect(() => {
    let active = true;
    api(path)
      .then((data) => active && setResult({ key, data, error: null }))
      .catch((error) => active && setResult({ key, data: null, error }));
    return () => {
      active = false;
    };
  }, [key, path]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const current = result.key === key;
  return { data: result.data, error: current ? result.error : null, loading: !current, reload };
}
