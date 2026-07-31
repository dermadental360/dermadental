"use client";

import { useEffect } from "react";
import { trackSearch } from "@/lib/metaPixel";

export function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    if (query && query.trim()) {
      trackSearch({ search_string: query.trim() });
    }
  }, [query]);

  return null;
}
