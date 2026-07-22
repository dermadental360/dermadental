"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => (pathname === path ? "active" : "");

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <h2>DermaDental360</h2>
        <nav className="admin-menu">
          <Link href="/admin" className={isActive("/admin")}>
            📊 Dashboard
          </Link>
          <Link href="/admin/products" className={isActive("/admin/products")}>
            🧴 Products
          </Link>
          <Link href="/admin/orders" className={isActive("/admin/orders")}>
            📦 Orders
          </Link>
          <Link href="/admin/inquiries" className={isActive("/admin/inquiries")}>
            💬 Inquiries
          </Link>
          <Link href="/admin/reviews" className={isActive("/admin/reviews")}>
            ⭐️ Reviews
          </Link>
          <Link href="/admin/logs" className={isActive("/admin/logs")}>
            📋 Audit Logs
          </Link>
          <Link href="/admin/settings" className={isActive("/admin/settings")}>
            ⚙️ Site Settings
          </Link>
          <Link href="/admin/theme" className={isActive("/admin/theme")}>
            🎨 Website Theme
          </Link>
          <Link href="/admin/hero-slides" className={isActive("/admin/hero-slides")}>
            🖼️ Hero Slider
          </Link>
          <Link href="/admin/change-password" className={isActive("/admin/change-password")}>
            🔑 Change Password
          </Link>

          
          <Link href="/" style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18 }}>



            ← View Site
          </Link>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              background: "none",
              border: "none",
              color: "#cbd5e1",
              textAlign: "left",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              borderRadius: "var(--radius-sm)",
              transition: "background-color 0.2s"
            }}
            className="admin-logout-btn"
          >
            🚪 Log Out
          </button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
