import { NextRequest } from "next/server";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed cache
const rateLimitStore = new Map<string, RateLimitStore>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limiting function
 * @param request - The NextRequest object
 * @param identifier - Unique identifier for the rate limit (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 */
export function rateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${request.nextUrl.pathname}`;

  let store = rateLimitStore.get(key);

  // Initialize or reset if window has passed
  if (!store || store.resetTime < now) {
    store = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, store);
  }

  // Increment request count
  store.count++;

  const isAllowed = store.count <= config.maxRequests;

  return {
    success: isAllowed,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - store.count),
    reset: store.resetTime,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  // Very strict for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
  },
  // Moderate for form submissions
  FORM_SUBMIT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 submissions per minute
  },
  // Lenient for general API
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
};
