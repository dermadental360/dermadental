interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-memory rate limiter helper for backend payment endpoints.
 * @param ip Client IP address or request identifier
 * @param limit Max allowed requests within window
 * @param windowMs Window duration in milliseconds (default 1 minute)
 */
export function checkRateLimit(ip: string, limit = 10, windowMs = 60 * 1000): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
