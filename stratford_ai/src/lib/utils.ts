import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Financial utility functions
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (isNaN(value) || !isFinite(value)) {
    return '$0.00'
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0.00%'
  }

  return `${value.toFixed(decimals)}%`
}

export function formatLargeNumber(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0'
  }

  const suffixes = ['', 'K', 'M', 'B', 'T']
  const tier = Math.log10(Math.abs(value)) / 3 | 0

  if (tier === 0) return value.toString()

  const suffix = suffixes[tier] || 'e' + tier
  const scale = Math.pow(10, tier * 3)
  const scaled = value / scale

  return scaled.toFixed(1) + suffix
}

export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0
  if (isNaN(current) || isNaN(previous) || !isFinite(current) || !isFinite(previous)) {
    return 0
  }

  return ((current - previous) / previous) * 100
}

export function calculateSimpleReturn(
  currentPrice: number,
  initialPrice: number
): number {
  if (initialPrice === 0) return 0
  if (isNaN(currentPrice) || isNaN(initialPrice) || !isFinite(currentPrice) || !isFinite(initialPrice)) {
    return 0
  }

  return ((currentPrice - initialPrice) / initialPrice) * 100
}

export function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < 2 || period < 2) return 0

  const returns = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] === 0) continue
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  }

  if (returns.length === 0) return 0

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length

  return Math.sqrt(variance) * 100 // Convert to percentage
}

export function generateDeterministicNumbers(
  seed: number,
  count: number,
  min: number,
  max: number
): number[] {
  const numbers: number[] = []
  let currentSeed = seed

  for (let i = 0; i < count; i++) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff
    const normalized = currentSeed / 0x7fffffff
    const num = Math.floor(normalized * (max - min + 1)) + min
    numbers.push(num)
  }

  return numbers
}

export function validateAPIKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false

  // Basic validation: minimum length and format
  return apiKey.length >= 16 && /^[A-Za-z0-9_\-]+$/.test(apiKey)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: any[]) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }) as T
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean

  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}