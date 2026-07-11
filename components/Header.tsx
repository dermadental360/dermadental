"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { clinic } from "@/lib/constants";

export function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const [customer, setCustomer] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [topBarText, setTopbarText] = useState("Book clinic guidance with " + clinic.doctor + " - " + clinic.timing);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.top_bar_text) {
          setTopbarText(data.top_bar_text);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch session status whenever the path changes
  useEffect(() => {
    fetch("/api/customer/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCustomer(data))
      .catch(() => setCustomer(null));
  }, [pathname]);

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



      <header className="header">
        <nav className="container nav">
          <Link href="/" className="brand">
            Derma<span>Dental360</span>
          </Link>
          <div className="navlinks">
            <Link href="/shop" className={isActive("/shop")}>Shop</Link>
            <Link href="/category/skin" className={isActive("/category/skin")}>Skin</Link>
            <Link href="/category/hair" className={isActive("/category/hair")}>Hair</Link>
            <Link href="/consultation" className={isActive("/consultation")}>Consultation</Link>
            <Link href="/about" className={isActive("/about")}>About</Link>
            <Link href="/contact" className={isActive("/contact")}>Contact</Link>
          </div>
          <div className="actions">
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
        </nav>
      </header>
    </>
  );
}

