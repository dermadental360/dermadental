"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".reveal, [data-reveal]");
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: "100px 0px 100px 0px" }
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < (window.innerHeight || 800) + 200) {
          el.classList.add("revealed");
        } else {
          observer.observe(el);
        }
      });

      // Safety fallback timer: guarantee all elements are revealed so mobile pages NEVER remain blank
      const fallbackTimer = setTimeout(() => {
        elements.forEach((el) => el.classList.add("revealed"));
      }, 200);

      return () => {
        clearTimeout(fallbackTimer);
        elements.forEach((el) => observer.unobserve(el));
      };
    }, 20);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
