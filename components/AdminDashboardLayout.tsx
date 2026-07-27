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

  const getPageTitle = (path: string) => {
    if (path === "/admin") return "Dashboard";
    if (path.startsWith("/admin/notifications")) return "Notifications";
    if (path.startsWith("/admin/products")) return "Products";
    if (path.startsWith("/admin/orders")) return "Orders";
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
    <div className="admin-shell min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row overflow-x-hidden">
      <NotificationToastContainer />

      {/* Desktop Sidebar (>1024px) */}
      <aside className="admin-side hidden lg:flex flex-col w-[280px] bg-[#161e1b] text-slate-200 p-6 border-r border-white/10 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-[var(--sage,#14B8C4)] flex items-center justify-center font-bold text-white shadow">
            DD
          </div>
          <div>
            <h2 className="font-playfair text-lg font-bold text-white leading-tight">DermaDental360</h2>
            <p className="text-xs text-slate-400">Admin Control Center</p>
          </div>
        </div>

        <nav className="admin-menu flex flex-col gap-1.5 flex-1">
          {navLinks.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--sage-dark,#0F7F8F)] text-white font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>🌐</span> View Public Website
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 w-full transition-colors text-left"
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Slide-in Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[10000] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-in Drawer (<1024px) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-[#161e1b] text-slate-200 p-6 z-[10001] shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden overflow-y-auto ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation Drawer"
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--sage,#14B8C4)] flex items-center justify-center font-bold text-white text-xs">
              DD
            </div>
            <h2 className="font-playfair text-base font-bold text-white">DermaDental360</h2>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close Navigation Menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navLinks.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--sage-dark,#0F7F8F)] text-white font-semibold"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
            >
              <span>🌐</span> View Public Website
            </Link>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 w-full text-left"
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div>
              <h1 className="font-playfair text-lg md:text-xl font-bold text-slate-900 leading-tight">
                {getPageTitle(pathname)}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Dr. Sadaf Yamin Clinic Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AdminNotificationBell />
            
            <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-200">
                SY
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">Dr. Sadaf Yamin</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Log Out"
              aria-label="Log Out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
