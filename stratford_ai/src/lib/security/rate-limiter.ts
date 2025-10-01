import { NextApiRequest } from 'next'
import { RedisService } from '@/lib/database/redis'

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: NextApiRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfter: number
  total: number
}

const redis = new RedisService()

export async function rateLimit(
  req: NextApiRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const {
    maxRequests,
    windowMs,
    keyGenerator = (req) => req.ip || 'anonymous',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options

  const key = `rate_limit:${keyGenerator(req)}`
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    // Get current request count in the window
    const requests = await redis.getRequestsInWindow(key, windowStart, now)

    if (requests >= maxRequests) {
      const retryAfter = windowMs - (now % windowMs)
      return {
        success: false,
        remaining: 0,
        retryAfter,
        total: maxRequests
      }
    }

    // Add current request to the window
    await redis.addRequestToWindow(key, now, windowMs)

    return {
      success: true,
      remaining: maxRequests - requests - 1,
      retryAfter: 0,
      total: maxRequests
    }

  } catch (error) {
    console.error('Rate limiting error:', error)
    // On Redis error, allow the request to proceed
    return {
      success: true,
      remaining: maxRequests - 1,
      retryAfter: 0,
      total: maxRequests
    }
  }
}

// Middleware wrapper for rate limiting
export function withRateLimit(options: RateLimitOptions) {
  return async (req: NextApiRequest, res: any, next: () => void) => {
    const result = await rateLimit(req, options)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + options.windowMs).toISOString())

    if (!result.success) {
      res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000))
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(result.retryAfter / 1000)
      })
    }

    next()
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Trading endpoints (more restrictive)
  trading: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Public data endpoints
  public: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
  }
}