"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(event.currentTarget);
    const name = data.get("name");
    const phone = data.get("phone");
    const email = data.get("email");
    const password = data.get("password");

    try {
      const response = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to register account");
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
    <main className="section page-enter" style={{ display: "grid", placeItems: "center", minHeight: "75vh" }}>
      <form className="card pad form reveal" onSubmit={submit} style={{ width: "100%", maxWidth: 440 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Create Account</p>
        <h1 style={{ fontSize: 28, margin: "6px 0 18px 0" }}>Sign Up</h1>
        
        {error && (
          <p style={{ color: "var(--error)", fontSize: 14, background: "rgba(201, 74, 74, 0.08)", padding: "10px 14px", borderRadius: "6px" }}>
            {error}
          </p>
        )}

        <div className="field">
          <label>Full Name</label>
          <input className="input" name="name" type="text" placeholder="Enter your full name" required />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input className="input" name="phone" type="tel" placeholder="Enter your phone number" required />
        </div>


        <div className="field">
          <label>Email Address</label>
          <input className="input" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <div className="field">
          <label>Password</label>
          <input className="input" name="password" type="password" placeholder="••••••••" minLength={6} required />
        </div>

        <button className="btn" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", fontSize: 14, marginTop: 12, color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "var(--sage-dark)", fontWeight: 600, textDecoration: "underline" }}>
            Sign In
          </Link>
        </p>
      </form>
    </main>
  );
}
