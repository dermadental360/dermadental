import { cache } from "react";
import { prisma } from "./prisma";

export interface LegalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  published: boolean;
  isDraft: boolean;
  version: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalPageRevision {
  id: string;
  legalPageId: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  version: number;
  savedAt: Date;
}

// Server-side XSS sanitizer — strips dangerous tags and attributes
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+on\w+\s*=\s*[^>\s]*/gi, "")
    // Remove javascript: in hrefs/srcs
    .replace(/href\s*=\s*(['"])\s*javascript:/gi, 'href=$1#')
    .replace(/src\s*=\s*(['"])\s*javascript:/gi, 'src=$1#')
    // Remove <iframe>, <object>, <embed>, <base>
    .replace(/<(iframe|object|embed|base|link|meta|form)[^>]*>.*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|base|link|meta|form)[^>]*\/?>/gi, "")
    // Remove data: URIs in attributes
    .replace(/(href|src)\s*=\s*(['"])\s*data:/gi, '$1=$2#');
}

export const getLegalPage = cache(async function getLegalPage(slug: string): Promise<LegalPage | null> {
  try {
    const page = await (prisma as any).legalPage.findFirst({
      where: { slug, published: true },
    });
    return page || null;
  } catch (err) {
    console.error("getLegalPage failed:", err);
    return null;
  }
});

export const getAllLegalPages = cache(async function getAllLegalPages(): Promise<LegalPage[]> {
  try {
    const pages = await (prisma as any).legalPage.findMany({
      orderBy: { createdAt: "asc" },
    });
    return pages;
  } catch (err) {
    console.error("getAllLegalPages failed:", err);
    return [];
  }
});

export const getAllLegalPagesAdmin = async function getAllLegalPagesAdmin(): Promise<LegalPage[]> {
  try {
    const pages = await (prisma as any).legalPage.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return pages;
  } catch (err) {
    console.error("getAllLegalPagesAdmin failed:", err);
    return [];
  }
};

export const getLegalPageById = async function getLegalPageById(id: string): Promise<LegalPage | null> {
  try {
    const page = await (prisma as any).legalPage.findUnique({
      where: { id },
    });
    return page || null;
  } catch (err) {
    console.error("getLegalPageById failed:", err);
    return null;
  }
};

export function calcReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
