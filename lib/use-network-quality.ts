"use client";

import { useSyncExternalStore } from "react";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

// Whether the hero video should even attempt to load. Unknown
// connections are allowed through, since the Network Information API
// isn't available on iOS Safari at all — this only actively blocks
// data-saver mode and confirmed 2g/slow-2g.
export function useAllowsVideo(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const connection = getConnection();
      connection?.addEventListener?.("change", onChange);
      return () => connection?.removeEventListener?.("change", onChange);
    },
    () => {
      const connection = getConnection();
      if (!connection) return true;
      const blocked =
        connection.saveData === true ||
        connection.effectiveType === "2g" ||
        connection.effectiveType === "slow-2g";
      return !blocked;
    },
    () => true
  );
}
