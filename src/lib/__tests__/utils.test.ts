import {
  cn,
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  calculatePercentageChange,
  calculateSimpleReturn,
  calculateVolatility,
  generateDeterministicNumbers,
  validateAPIKey,
  debounce,
  throttle,
} from '../utils'

describe('cn utility function', () => {
  test('combines class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  test('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('formatCurrency', () => {
  test('formats positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  test('formats negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
  })

  test('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  test('handles different currencies', () => {
    expect(formatCurrency(1000, 'EUR')).toContain('1,000.00')
  })

  test('handles invalid inputs', () => {
    expect(formatCurrency(NaN)).toBe('$0.00')
    expect(formatCurrency(Infinity)).toBe('$0.00')
    expect(formatCurrency(-Infinity)).toBe('$0.00')
  })
})

describe('formatPercentage', () => {
  test('formats positive percentages', () => {
    expect(formatPercentage(12.345)).toBe('12.35%')
  })

  test('formats negative percentages', () => {
    expect(formatPercentage(-5.67)).toBe('-5.67%')
  })

  test('formats zero percentage', () => {
    expect(formatPercentage(0)).toBe('0.00%')
  })

  test('respects decimal places', () => {
    expect(formatPercentage(12.3456, 3)).toBe('12.346%')
    expect(formatPercentage(12.3456, 1)).toBe('12.3%')
  })

  test('handles invalid inputs', () => {
    expect(formatPercentage(NaN)).toBe('0.00%')
    expect(formatPercentage(Infinity)).toBe('0.00%')
  })
})

describe('formatLargeNumber', () => {
  test('formats small numbers without suffix', () => {
    expect(formatLargeNumber(999)).toBe('999')
  })

  test('formats thousands', () => {
    expect(formatLargeNumber(1234)).toBe('1.2K')
    expect(formatLargeNumber(999999)).toBe('1000.0K')
  })

  test('formats millions', () => {
    expect(formatLargeNumber(1234567)).toBe('1.2M')
  })

  test('formats billions', () => {
    expect(formatLargeNumber(1234567890)).toBe('1.2B')
  })

  test('formats trillions', () => {
    expect(formatLargeNumber(1234567890123)).toBe('1.2T')
  })

  test('handles negative numbers', () => {
    expect(formatLargeNumber(-1234567)).toBe('-1.2M')
  })

  test('handles zero', () => {
    expect(formatLargeNumber(0)).toBe('0')
  })

  test('handles invalid inputs', () => {
    expect(formatLargeNumber(NaN)).toBe('0')
    expect(formatLargeNumber(Infinity)).toBe('0')
  })
})

describe('calculatePercentageChange', () => {
  test('calculates positive change correctly', () => {
    expect(calculatePercentageChange(110, 100)).toBe(10)
  })

  test('calculates negative change correctly', () => {
    expect(calculatePercentageChange(90, 100)).toBe(-10)
  })

  test('handles zero previous value', () => {
    expect(calculatePercentageChange(100, 0)).toBe(0)
  })

  test('handles same values', () => {
    expect(calculatePercentageChange(100, 100)).toBe(0)
  })

  test('handles invalid inputs', () => {
    expect(calculatePercentageChange(NaN, 100)).toBe(0)
    expect(calculatePercentageChange(100, NaN)).toBe(0)
    expect(calculatePercentageChange(Infinity, 100)).toBe(0)
  })
})

describe('calculateSimpleReturn', () => {
  test('calculates positive return correctly', () => {
    expect(calculateSimpleReturn(110, 100)).toBe(10)
  })

  test('calculates negative return correctly', () => {
    expect(calculateSimpleReturn(90, 100)).toBe(-10)
  })

  test('handles zero initial price', () => {
    expect(calculateSimpleReturn(100, 0)).toBe(0)
  })

  test('handles invalid inputs', () => {
    expect(calculateSimpleReturn(NaN, 100)).toBe(0)
    expect(calculateSimpleReturn(100, NaN)).toBe(0)
  })
})

describe('calculateVolatility', () => {
  test('calculates volatility for price series', () => {
    const prices = [100, 102, 98, 105, 95, 103]
    const volatility = calculateVolatility(prices)
    expect(volatility).toBeGreaterThan(0)
    expect(typeof volatility).toBe('number')
  })

  test('returns zero for insufficient data', () => {
    expect(calculateVolatility([])).toBe(0)
    expect(calculateVolatility([100])).toBe(0)
  })

  test('handles zero prices', () => {
    const prices = [0, 100, 0, 200]
    const volatility = calculateVolatility(prices)
    expect(typeof volatility).toBe('number')
  })
})

describe('generateDeterministicNumbers', () => {
  test('generates consistent numbers with same seed', () => {
    const numbers1 = generateDeterministicNumbers(12345, 5, 1, 10)
    const numbers2 = generateDeterministicNumbers(12345, 5, 1, 10)
    expect(numbers1).toEqual(numbers2)
  })

  test('generates different numbers with different seeds', () => {
    const numbers1 = generateDeterministicNumbers(12345, 5, 1, 10)
    const numbers2 = generateDeterministicNumbers(54321, 5, 1, 10)
    expect(numbers1).not.toEqual(numbers2)
  })

  test('respects range constraints', () => {
    const numbers = generateDeterministicNumbers(12345, 100, 1, 6)
    numbers.forEach(num => {
      expect(num).toBeGreaterThanOrEqual(1)
      expect(num).toBeLessThanOrEqual(6)
      expect(Number.isInteger(num)).toBe(true)
    })
  })

  test('generates correct count', () => {
    const numbers = generateDeterministicNumbers(12345, 10, 1, 100)
    expect(numbers.length).toBe(10)
  })
})

describe('validateAPIKey', () => {
  test('validates correct API keys', () => {
    expect(validateAPIKey('abcd1234efgh5678')).toBe(true)
    expect(validateAPIKey('ABC-123_DEF-456')).toBe(true)
  })

  test('rejects short API keys', () => {
    expect(validateAPIKey('short')).toBe(false)
  })

  test('rejects invalid characters', () => {
    expect(validateAPIKey('invalid@key#here!')).toBe(false)
  })

  test('rejects empty or null values', () => {
    expect(validateAPIKey('')).toBe(false)
    expect(validateAPIKey(null as any)).toBe(false)
    expect(validateAPIKey(undefined as any)).toBe(false)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('delays function execution', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 1000)

    debouncedFn()
    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  test('cancels previous calls', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 1000)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    jest.advanceTimersByTime(1000)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('limits function calls', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 1000)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(mockFn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1000)
    throttledFn()
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})