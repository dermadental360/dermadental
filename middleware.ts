import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Suspended</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ef4444;
      margin-bottom: 12px;
    }
    p {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      margin-top: 24px;
      padding: 6px 16px;
      background: #451a1a;
      color: #fca5a5;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Website Temporarily Suspended</h1>
    <p>This website is currently inactive. Please contact the administrator or service provider for more information.</p>
    <div class="badge">Status: 402 - Account On Hold</div>
  </div>
</body>
</html>`,
    {
      status: 402,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
