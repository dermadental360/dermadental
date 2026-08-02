import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Suspended - Payment Pending</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background: #151c2c;
      border: 1px solid #ef4444;
      border-radius: 16px;
      padding: 48px 36px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.25);
    }
    .icon {
      font-size: 56px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ef4444;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 16px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .notice-box {
      background: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #fca5a5;
      margin-bottom: 24px;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      background: #ef4444;
      color: #ffffff;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🚫</div>
    <h1>WEBSITE SUSPENDED</h1>
    <div class="notice-box">
      Jab tak pending payment clear nahi hoga, tab tak website band rahegi aur nahi khulegi.
    </div>
    <p>This website has been temporarily disabled due to non-payment of development & hosting dues. Full access will be restored immediately once payment is settled.</p>
    <div class="status-badge">Status: Payment Required (402)</div>
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
