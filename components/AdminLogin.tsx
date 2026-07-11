"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") })
      });
      if (!response.ok) {
        setError("Invalid admin email or password");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "80vh", width: "100%", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Animated welcome header info */}
        <div style={{ textAlign: "center", animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <p className="eyebrow" style={{ color: "var(--gold)", fontWeight: 700, margin: 0 }}>DermaDental360 Clinic</p>
          <h1 style={{ fontSize: "clamp(24px, 4.5vw, 36px)", margin: "6px 0 10px 0", fontFamily: "'Playfair Display', serif" }}>
            Welcome, Dr. Sadaf Yamin
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
            Manage DermaDental360 products, orders, inquiries, and clinic activity.
          </p>
        </div>

        {/* Login form card with entrance animation */}
        <form
          className="card pad form"
          onSubmit={submit}
          style={{
            animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            boxShadow: "var(--shadow-lg)",
            backgroundColor: "var(--white)"
          }}
          autoComplete="off"
        >
          <p className="eyebrow" style={{ margin: 0, fontSize: 11 }}>Secure Authentication</p>
          <h2 style={{ fontSize: 20, margin: "2px 0 14px 0", fontWeight: 700 }}>Admin Sign In</h2>
          
          {error && (
            <p style={{ color: "var(--error)", fontSize: 13, background: "rgba(201, 74, 74, 0.08)", padding: "10px 14px", borderRadius: "6px", margin: 0 }}>
              {error}
            </p>
          )}

          <div className="field">
            <label style={{ fontSize: 13, fontWeight: 600 }}>Email Address</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email address"
              defaultValue=""
              autoComplete="new-email"
              required
            />
          </div>

          <div className="field">
            <label style={{ fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                defaultValue=""
                autoComplete="new-password"
                required
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  display: "grid",
                  placeItems: "center",
                  padding: 4
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <button className="btn" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
