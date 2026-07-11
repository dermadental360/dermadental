"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(event.currentTarget);
    const identifier = data.get("identifier");
    const password = data.get("password");

    try {
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid sign in details");
        setLoading(false);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="section page-enter" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <form className="card pad form reveal" onSubmit={submit} style={{ width: "100%", maxWidth: 440 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Customer Portal</p>
        <h1 style={{ fontSize: 28, margin: "6px 0 18px 0" }}>Sign In</h1>
        
        {error && (
          <p style={{ color: "var(--error)", fontSize: 14, background: "rgba(201, 74, 74, 0.08)", padding: "10px 14px", borderRadius: "6px" }}>
            {error}
          </p>
        )}

        <div className="field">
          <label>Email or Phone Number</label>
          <input className="input" name="identifier" type="text" placeholder="Enter email or phone number" required />
        </div>

        <div className="field">
          <label>Password</label>
          <input className="input" name="password" type="password" placeholder="••••••••" required />
        </div>

        <button className="btn" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <p style={{ textAlign: "center", fontSize: 14, marginTop: 12, color: "var(--muted)" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "var(--sage-dark)", fontWeight: 600, textDecoration: "underline" }}>
            Sign Up
          </Link>
        </p>
      </form>
    </main>
  );
}
