"use client";

import { useMediaQuery } from "@/lib/use-media-query";

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
