/**
 * Vitest test setup file
 *
 * This file runs before all tests and sets up the testing environment
 * for Stratford AI deterministic testing.
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { RANDOM_SEED } from '@/constants';
import '@testing-library/jest-dom';
import { server } from './mocks/server';
import { fetch, Request, Response } from 'undici';

// Setup MSW server
beforeAll(() => {
  // Start the MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterAll(() => {
  // Stop the MSW server
  server.close();
});

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers();
});

// Polyfill fetch for Node.js testing environment
Object.defineProperty(globalThis, 'fetch', {
  value: fetch,
  writable: true
});
Object.defineProperty(globalThis, 'Request', {
  value: Request,
  writable: true
});
Object.defineProperty(globalThis, 'Response', {
  value: Response,
  writable: true
});

// Global test setup
beforeEach(() => {
  // Reset any global state before each test
  // This ensures test isolation and deterministic behavior

  // Reset environment variables to known state using vi.stubEnv
  vi.stubEnv('STRATFORD_RANDOM_SEED', RANDOM_SEED.toString());
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('ENABLE_MOCK_DATA', 'true');

  // Reset any global timers or mocks
  vi.useRealTimers();
});