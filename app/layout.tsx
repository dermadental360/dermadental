import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VisitorTracker } from "@/components/VisitorTracker";
import { FloatingCallWidget } from "@/components/FloatingCallWidget";

export const metadata: Metadata = {
  title: "DermaDental360 | Skin, Hair & Clinic Care",
  description: "Dermatologist-curated skin and hair care by Dr. Sadaf Yamin in Khar West, Mumbai."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="page-enter">
      <body>
        <ScrollReveal />
        <VisitorTracker />
        <CartProvider>
          <Header />
          {children}
          <Footer />
        </CartProvider>
        <FloatingCallWidget />
      </body>
    </html>
  );
}
