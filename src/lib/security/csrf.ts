import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface CSRFOptions {
  secret?: string
  tokenLength?: number
  cookieName?: string
  headerName?: string
  excludeMethods?: string[]
}

const defaultOptions: Required<CSRFOptions> = {
  secret: process.env.NEXTAUTH_SECRET || 'default-csrf-secret',
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  excludeMethods: ['GET', 'HEAD', 'OPTIONS']
}

export class CSRFError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CSRFError'
  }
}

export function generateCSRFToken(secret: string, sessionId?: string): string {
  const randomBytes = crypto.randomBytes(16).toString('hex')
  const sessionPart = sessionId ? crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 16) : ''

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(randomBytes + sessionPart)

  return randomBytes + hmac.digest('hex')
}

export function validateCSRFToken(token: string, secret: string, sessionId?: string): boolean {
  if (!token || token.length < 32) {
    return false
  }

  try {
    const randomBytes = token.slice(0, 32)
    const receivedHash = token.slice(32)
    const sessionPart = sessionId ? crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 16) : ''

    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(randomBytes + sessionPart)
    const expectedHash = hmac.digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    )
  } catch (error) {
    return false
  }
}

export function withCSRFProtection(options: CSRFOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    // Skip CSRF protection for safe methods
    if (config.excludeMethods.includes(req.method!)) {
      return next()
    }

    // Get session for session-bound tokens
    const session = await getSession({ req })
    const sessionId = session?.user?.id

    // Check for CSRF token in header or body
    const tokenFromHeader = req.headers[config.headerName] as string
    const tokenFromBody = req.body?.[config.cookieName]
    const token = tokenFromHeader || tokenFromBody

    if (!token) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request'
      })
    }

    if (!validateCSRFToken(token, config.secret, sessionId)) {
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'Invalid CSRF token provided'
      })
    }

    next()
  }
}

// API endpoint to get CSRF token
export async function getCSRFToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getSession({ req })
  const sessionId = session?.user?.id
  const secret = process.env.NEXTAUTH_SECRET || 'default-csrf-secret'

  const token = generateCSRFToken(secret, sessionId)

  // Set secure cookie with CSRF token
  res.setHeader('Set-Cookie', [
    `csrf-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
  ])

  res.status(200).json({ csrfToken: token })
}

// Utility to add CSRF token to forms
export function addCSRFTokenToForm(formData: FormData, token: string): FormData {
  formData.append('csrf-token', token)
  return formData
}

// React hook for CSRF token management
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf')
        const data = await response.json()
        setToken(data.csrfToken)
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  return { token, loading }
}

// Security headers middleware
export function withSecurityHeaders() {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for your needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stratford.ai wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))

    // Other security headers
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    next()
  }
}