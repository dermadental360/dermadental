import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get("label") || "DermaDental360";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
    <rect width="900" height="900" fill="#f6e8e4"/>
    <circle cx="705" cy="190" r="145" fill="#dce8e1"/>
    <rect x="220" y="210" width="290" height="470" rx="44" fill="#ffffff" stroke="#eadfd8" stroke-width="8"/>
    <rect x="280" y="155" width="170" height="90" rx="28" fill="#7f9b8f"/>
    <text x="450" y="735" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#24312d">${escapeXml(label)}</text>
  </svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[char] || char));
}
