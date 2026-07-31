"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/metaPixel";

export function OrderConfirmationTracker({ orderRef }: { orderRef?: string }) {
  useEffect(() => {
    if (!orderRef) return;
    if (typeof window !== "undefined") {
      const storageKey = `dd360_pixel_purchase_${orderRef}`;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, "true");
        trackPurchase({
          transaction_id: String(orderRef),
          currency: "INR",
          value: 0,
          content_ids: [],
          quantity: 1,
        });
      }
    }
  }, [orderRef]);

  return null;
}
