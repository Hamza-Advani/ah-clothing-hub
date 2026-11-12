"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** True only after hydration — use to render persisted (localStorage) state safely. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
