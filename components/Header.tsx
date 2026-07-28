"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { clinic } from "@/lib/constants";
import { useMotion } from "./motion/MotionProvider";

let cachedCustomerSession: any = undefined;

export function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const { isReducedMotion } = useMotion();
  const [customer, setCustomer] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const topBarText = "Book clinic guidance with " + clinic.doctor + " - " + clinic.timing;

  // Header scroll handler (Auto-hide on scroll down, reveal on scroll up, glass blur)
  useEffect(() => {
    if (isReducedMotion || pathname?.startsWith("/admin")) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY > 150 && currentScrollY > lastScrollY && !isMobileMenuOpen) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isReducedMotion, pathname, isMobileMenuOpen]);

  // Fetch session status once and cache across client route transitions
  useEffect(() => {
    if (cachedCustomerSession !== undefined) {
      setCustomer(cachedCustomerSession);
    } else {
      fetch("/api/customer/session")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const sess = data?.customer || (data?.email ? data : null);
          cachedCustomerSession = sess;
          setCustomer(sess);
        })
        .catch(() => setCustomer(null));
    }

    // Close mobile menu on path transition
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
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

  // Trigger pulse micro-interaction when cart item count changes
  useEffect(() => {
    if (cart.count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart.count]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (path: string) => (pathname === path ? "active" : "");

  return (
    <>
      <div className="topbar">
        {topBarText}
      </div>

      <header
        className={`header transition-all duration-300 ease-out ${
          isScrolled ? "header-scrolled shadow-md backdrop-blur-md bg-white/85 dark:bg-slate-950/85" : ""
        } ${isHidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
        style={{ willChange: "transform, opacity" }}
      >
        <nav className="container nav">
          <Link href="/" className="brand-logo">
            <img 
              src="/logo.webp" 
              alt="Dr. Sadaf's DermaDental 360" 
              className="logo-img"
              width={220}
              height={50}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="navlinks desktop-only">
            <Link href="/shop" className={isActive("/shop")}>Shop</Link>
            <Link href="/category/skin" className={isActive("/category/skin")}>Skin</Link>
            <Link href="/category/oral-care" className={isActive("/category/oral-care")}>Oral Care</Link>
            <Link href="/category/hair" className={isActive("/category/hair")}>Hair</Link>
            <Link href="/category/supplements" className={isActive("/category/supplements")}>Supplements</Link>
            {/* <Link href="/category/luxe" className={isActive("/category/luxe")}>Luxe</Link> */}
            <Link href="/consultation" className={isActive("/consultation")}>Consultation</Link>
            <Link href="/about" className={isActive("/about")}>About</Link>
            <Link href="/contact" className={isActive("/contact")}>Contact</Link>
          </div>

          {/* Desktop Actions */}
          <div className="actions desktop-only">
            <Link className={`btn secondary ${isActive("/search")}`} href="/search" style={{ padding: "10px 18px" }}>
              Search
            </Link>
            {customer ? (
              <Link className={`btn secondary ${isActive("/account")}`} href="/account" style={{ padding: "10px 18px" }}>
                Account
              </Link>
            ) : (
              <Link className={`btn secondary ${isActive("/signin")}`} href="/signin" style={{ padding: "10px 18px" }}>
                Sign In
              </Link>
            )}
            <Link className={`btn ${pulse ? "btn-pulse" : ""}`} href="/cart">
              Cart <span className="cart-badge">{cart.count}</span>
            </Link>
          </div>

          {/* Mobile Actions Header (Visible on mobile only) */}
          <div className="mobile-actions">
            <Link className={`btn ${pulse ? "btn-pulse" : ""}`} href="/cart" style={{ padding: "8px 16px" }}>
              Cart <span className="cart-badge">{cart.count}</span>
            </Link>
            <button 
              className={`hamburger ${isMobileMenuOpen ? "open" : ""}`} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer Overlay (Now sibling to header) */}
      <div className={`mobile-drawer-overlay ${isMobileMenuOpen ? "open" : ""}`} onClick={() => setIsMobileMenuOpen(false)} />
      <div className={`mobile-drawer ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <Link href="/" className="brand-logo" onClick={() => setIsMobileMenuOpen(false)}>
            <img 
              src="/logo.webp" 
              alt="Dr. Sadaf's DermaDental 360" 
              className="logo-img"
              width={220}
              height={50}
            />
          </Link>
          <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>
        </div>
        <div className="drawer-links">
          <Link href="/shop" className={isActive("/shop")}>Shop</Link>
          <Link href="/category/skin" className={isActive("/category/skin")}>Skin</Link>
          <Link href="/category/oral-care" className={isActive("/category/oral-care")}>Oral Care</Link>
          <Link href="/category/hair" className={isActive("/category/hair")}>Hair</Link>
          <Link href="/category/supplements" className={isActive("/category/supplements")}>Supplements</Link>
          <Link href="/consultation" className={isActive("/consultation")}>Consultation</Link>
          <Link href="/about" className={isActive("/about")}>About</Link>
          <Link href="/contact" className={isActive("/contact")}>Contact</Link>
          <div className="drawer-divider" />
          <Link href="/search" className={isActive("/search")}>Search</Link>
          {customer ? (
            <Link href="/account" className={isActive("/account")}>My Account</Link>
          ) : (
            <Link href="/signin" className={isActive("/signin")}>Sign In</Link>
          )}
        </div>
      </div>
    </>
  );
}
