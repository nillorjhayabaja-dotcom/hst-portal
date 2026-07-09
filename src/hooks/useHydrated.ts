import { useEffect, useState } from "react";

// Returns true only after the client has hydrated. Use to gate rendering that
// depends on localStorage / window so SSR and first paint stay consistent.
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
