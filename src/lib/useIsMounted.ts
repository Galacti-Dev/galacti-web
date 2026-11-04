"use client";

import { useEffect, useState } from "react";

/**
 * Standard React hook to detect when component has mounted on the client.
 * Guarantees that initial client render matches SSR bit-for-bit to prevent hydration crashes.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}
