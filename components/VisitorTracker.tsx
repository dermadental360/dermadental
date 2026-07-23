"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or retrieve anonymous visitor UUID
    let visitorId = localStorage.getItem("dd360_visitor_id");
    if (!visitorId) {
      visitorId = `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("dd360_visitor_id", visitorId);
    }

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/analytics/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId })
        });
      } catch (err) {
        // Fail silently in background
      }
    };

    // Defer heartbeat ping by 2 seconds to avoid blocking main thread during initial page load
    const timer = setTimeout(sendHeartbeat, 2000);

    // Setup recurring heartbeat pings every 120 seconds
    const interval = setInterval(sendHeartbeat, 120000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
