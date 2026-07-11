"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountClient() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/customer/logout", { method: "POST" });
      router.push("/signin");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <button className="btn secondary" onClick={handleLogout} disabled={loggingOut}>
      {loggingOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
