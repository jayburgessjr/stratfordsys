/**
 * Tests for environment configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset modules to test environment parsing
    vi.resetModules();

    // Set test environment variables using vi.stubEnv
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('STRATFORD_RANDOM_SEED', '42');
    vi.stubEnv('ENABLE_MOCK_DATA', 'true');
  });

  it('should parse environment variables correctly', async () => {
    const { env } = await import('./env');

    expect(env.NODE_ENV).toBe('test');
    expect(env.STRATFORD_RANDOM_SEED).toBe(42);
    expect(env.ENABLE_MOCK_DATA).toBe(true);
  });

  it('should provide default values for missing variables', async () => {
    // Remove some environment variables using vi.stubEnv
    vi.stubEnv('NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY', '');
    vi.stubEnv('LOG_LEVEL', '');

    const { env } = await import('./env');

    expect(env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY).toBeUndefined();
    expect(env.LOG_LEVEL).toBe('debug'); // Default value
  });

  it('should provide environment-specific helpers', async () => {
    const { isDevelopment, isProduction, isTest } = await import('./env');

    expect(isTest).toBe(true);
    expect(isDevelopment).toBe(false);
    expect(isProduction).toBe(false);
  });

  it('should provide API configuration helpers', async () => {
    vi.stubEnv('NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY', 'test-key');
    vi.stubEnv('API_TIMEOUT_MS', '5000');

    const { getApiConfig } = await import('./env');
    const apiConfig = getApiConfig();

    expect(apiConfig.alphaVantage.apiKey).toBe('test-key');
    expect(apiConfig.alphaVantage.timeout).toBe(5000);
    expect(apiConfig.yahooFinance.enabled).toBe(true);
  });

  it('should provide deterministic seeds', async () => {
    const { getSeeds } = await import('./env');
    const seeds = getSeeds();

    expect(seeds.random).toBe(42);
    expect(seeds.simulation).toBe(42);
    expect(seeds.backtest).toBe(42);
  });

  it('should handle invalid environment values gracefully', async () => {
    vi.stubEnv('STRATFORD_RANDOM_SEED', 'invalid-number');
    vi.stubEnv('LOG_LEVEL', 'invalid-level');

    // This should throw due to Zod validation
    await expect(async () => {
      await import('./env');
    }).rejects.toThrow();
  });
});
