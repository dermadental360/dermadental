"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { NotificationToastContainer } from "@/components/NotificationToastContainer";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getPageTitle = (path: string) => {
    if (path === "/admin") return "Dashboard";
    if (path.startsWith("/admin/notifications")) return "Notifications";
    if (path.startsWith("/admin/products")) return "Products";
    if (path.startsWith("/admin/orders")) return "Orders";
    if (path.startsWith("/admin/customers")) return "Customer Database";
    if (path.startsWith("/admin/pricing")) return "Pricing & Shipping Rules";
    if (path.startsWith("/admin/inquiries")) return "Inquiries";
    if (path.startsWith("/admin/reviews")) return "Reviews";
    if (path.startsWith("/admin/logs")) return "Audit Logs";
    if (path.startsWith("/admin/settings")) return "Site Settings";
    if (path.startsWith("/admin/theme")) return "Website Theme";
    if (path.startsWith("/admin/hero-slides")) return "Hero Slider";
    if (path.startsWith("/admin/legal")) return "Legal Pages";
    if (path.startsWith("/admin/change-password")) return "Change Password";
    return "Admin Panel";
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
    { href: "/admin/products", label: "Products", icon: "🧴" },
    { href: "/admin/orders", label: "Orders", icon: "📦" },
    { href: "/admin/customers", label: "Customer Database", icon: "👥" },
    { href: "/admin/pricing", label: "Pricing & Shipping", icon: "💳" },
    { href: "/admin/inquiries", label: "Inquiries", icon: "💬" },
    { href: "/admin/reviews", label: "Reviews", icon: "⭐️" },
    { href: "/admin/logs", label: "Audit Logs", icon: "📋" },
    { href: "/admin/settings", label: "Site Settings", icon: "⚙️" },
    { href: "/admin/theme", label: "Website Theme", icon: "🎨" },
    { href: "/admin/hero-slides", label: "Hero Slider", icon: "🖼️" },
    { href: "/admin/legal", label: "Legal Pages", icon: "📄" },
    { href: "/admin/change-password", label: "Change Password", icon: "🔑" },
  ];

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NotificationToastContainer />

      {/* Desktop Permanent Sidebar */}
      <aside
        className="admin-side desktop-only"
        style={{
          width: 260,
          backgroundColor: "#161e1b",
          color: "#e2e8f0",
          padding: "32px 24px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "var(--sage, #14B8C4)", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            DD
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#ffffff", fontSize: 18, margin: 0, padding: 0, border: "none" }}>
              DermaDental360
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Dr. Sadaf Yamin Clinic</p>
          </div>
        </div>

        <nav className="admin-menu" style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1 }}>
          {navLinks.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "active" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  color: active ? "#ffffff" : "#cbd5e1",
                  backgroundColor: active ? "var(--sage, #14B8C4)" : "transparent",
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  transition: "all 0.2s ease"
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}
            >
              <span>🌐</span> View Public Site
            </Link>

            <button
              onClick={handleLogout}
              className="admin-logout-btn"
              style={{
                background: "none",
                border: "none",
                color: "#f87171",
                textAlign: "left",
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                borderRadius: "var(--radius-sm)"
              }}
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Slide-in Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 10000
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          maxWidth: "85vw",
          backgroundColor: "#161e1b",
          color: "#e2e8f0",
          padding: "24px 20px",
          zIndex: 10001,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          overflowY: "auto"
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Menu"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--sage, #14B8C4)", color: "#ffffff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              DD
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: "#ffffff" }}>DermaDental360</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer", padding: 4 }}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1 }}>
          {navLinks.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  color: active ? "#ffffff" : "#cbd5e1",
                  backgroundColor: active ? "var(--sage, #14B8C4)" : "transparent",
                  fontWeight: active ? 600 : 500,
                  fontSize: 14
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}
            >
              <span>🌐</span> View Public Site
            </Link>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#f87171",
                textAlign: "left",
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                borderRadius: "var(--radius-sm)"
              }}
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main" style={{ flexGrow: 1, minWidth: 0, padding: 0, backgroundColor: "#faf9f6" }}>
        {/* Sticky Top Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 90,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid var(--line, #e2e8f0)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mobile-actions"
              style={{
                background: "none",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--ink)"
              }}
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--ink)" }}>
                {getPageTitle(pathname)}
              </h1>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Dr. Sadaf Yamin Clinic</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <AdminNotificationBell />
            <div style={{ height: 24, width: 1, backgroundColor: "var(--line)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1e293b", color: "#ffffff", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                SY
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: "28px" }}>{children}</div>
      </main>
    </div>
  );
}
