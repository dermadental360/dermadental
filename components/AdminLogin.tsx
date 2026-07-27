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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: "24px",
        color: "#ffffff",
        boxSizing: "border-box"
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Animated welcome header info */}
        <div style={{ textAlign: "center", animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "var(--sage, #14B8C4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#ffffff",
              fontSize: 20,
              margin: "0 auto 14px auto",
              boxShadow: "0 10px 25px rgba(20,184,196,0.3)"
            }}
          >
            DD
          </div>
          <p className="eyebrow" style={{ color: "var(--accent, #38D9E6)", fontWeight: 700, margin: 0, letterSpacing: 2 }}>
            DermaDental360 Clinic
          </p>
          <h1 style={{ fontSize: "clamp(24px, 4.5vw, 34px)", margin: "6px 0 8px 0", fontFamily: "'Playfair Display', serif", color: "#ffffff" }}>
            Admin Portal Access
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
            Authorized portal for Dr. Sadaf Yamin and clinic management.
          </p>
        </div>

        {/* Login form card */}
        <form
          onSubmit={submit}
          style={{
            animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "16px",
            padding: "32px 28px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
          autoComplete="off"
        >
          <div style={{ borderBottom: "1px solid #334155", paddingBottom: 12 }}>
            <p className="eyebrow" style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Authentication</p>
            <h2 style={{ fontSize: 20, margin: "2px 0 0 0", fontWeight: 700, color: "#ffffff" }}>Sign In to Dashboard</h2>
          </div>
          
          {error && (
            <div style={{ backgroundColor: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fda4af", fontSize: 13, padding: "12px 16px", borderRadius: "10px" }}>
              {error}
            </div>
          )}

          <div className="field">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6, display: "block" }}>Email Address</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Enter email address"
              defaultValue=""
              autoComplete="new-email"
              required
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "14px 16px",
                fontSize: 14,
                minHeight: 48,
                width: "100%",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div className="field">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6, display: "block" }}>Password</label>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                className="input"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                defaultValue=""
                autoComplete="new-password"
                required
                style={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "14px 48px 14px 16px",
                  fontSize: 14,
                  minHeight: 48,
                  width: "100%",
                  boxSizing: "border-box"
                }}
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

          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: 8,
              backgroundColor: "var(--sage-dark, #0F7F8F)",
              color: "#ffffff",
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              borderRadius: "10px",
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            {loading ? "Verifying Credentials..." : "Access Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
