"use client";

import { useSyncExternalStore } from "react";
import { STATIC_REFERENCE_DATE } from "@/lib/eventUtils";

const emptySubscribe = () => () => {};
const getClientTime = () => Date.now();
const getServerTime = () => STATIC_REFERENCE_DATE.getTime();

/**
 * Hook returning current client timestamp with hydration-safe static fallback for SSR.
 */
export function useCurrentTimestamp(): number {
  return useSyncExternalStore(emptySubscribe, getClientTime, getServerTime);
}
