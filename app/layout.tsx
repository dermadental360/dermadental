import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { ScrollReveal } from "@/components/ScrollReveal";
import { VisitorTracker } from "@/components/VisitorTracker";
import { FloatingCallWidget } from "@/components/FloatingCallWidget";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dd360health.com"),
  title: "DermaDental360 | Skin, Hair & Clinic Care",
  description: "Dermatologist-curated skin and hair care by Dr. Sadaf Yamin in Khar West, Mumbai.",
  alternates: {
    canonical: "https://www.dd360health.com",
  },
  openGraph: {
    title: "DermaDental360 | Skin, Hair & Clinic Care",
    description: "Dermatologist-curated skin and hair care by Dr. Sadaf Yamin in Khar West, Mumbai.",
    url: "https://www.dd360health.com",
    siteName: "DermaDental360",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "DermaDental360 Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DermaDental360 | Skin, Hair & Clinic Care",
    description: "Dermatologist-curated skin and hair care by Dr. Sadaf Yamin in Khar West, Mumbai.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="page-enter">
      <body>
        <ThemeProvider>
          <ScrollReveal />
          <VisitorTracker />
          <CartProvider>
            <Header />
            {children}
            <Footer />
          </CartProvider>
          <FloatingCallWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
