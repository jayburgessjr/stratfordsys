/**
 * MSW Server Configuration for Node.js Testing
 *
 * Sets up Mock Service Worker for server-side testing
 * in Vitest and other Node.js environments.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

// Helper to reset handlers during tests
export const resetHandlers = () => {
  server.resetHandlers(...handlers);
};

// Helper to add temporary handlers for specific tests
export const addHandler = (handler: any) => {
  server.use(handler);
};

// Helper to simulate network errors
export const simulateNetworkError = (url: string) => {
  server.use(
    // This will be filled in when we implement specific API services
  );
};