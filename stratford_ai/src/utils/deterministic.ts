/**
 * Deterministic utilities for reproducible calculations
 *
 * This module provides seeded random number generation and other
 * deterministic utilities to ensure reproducible results.
 */

import { RANDOM_SEED } from '@/constants';

/**
 * Simple Linear Congruential Generator for deterministic randomness
 * Using the same algorithm across all environments ensures reproducibility
 */
export class SeededRandom {
  private seed: number;
  private current: number;

  constructor(seed: number = RANDOM_SEED) {
    this.seed = seed;
    this.current = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.current = (this.current * 1664525 + 1013904223) % 4294967296;
    return this.current / 4294967296;
  }

  /**
   * Generate random number in range [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate normally distributed random number (Box-Muller transform)
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Reset the generator with a new seed
   */
  reset(seed: number = RANDOM_SEED): void {
    this.seed = seed;
    this.current = seed;
  }

  /**
   * Get current state
   */
  getState(): number {
    return this.current;
  }

  /**
   * Set current state
   */
  setState(state: number): void {
    this.current = state;
  }
}

// Export singleton instance for global use
export const seededRandom = new SeededRandom(RANDOM_SEED);

/**
 * Get current timestamp in a deterministic format
 */
export function getDeterministicTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a deterministic hash from a string
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate deterministic UUID based on seed and input
 */
export function deterministicUUID(input: string, seed: number = RANDOM_SEED): string {
  const rng = new SeededRandom(seed + simpleHash(input));

  const chars = '0123456789abcdef';
  let uuid = '';

  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += chars[rng.nextInt(0, 15)];
  }

  // Set version (4) and variant bits
  uuid = uuid.substring(0, 14) + '4' + uuid.substring(15);
  const variant = '89ab'[rng.nextInt(0, 3)];
  uuid = uuid.substring(0, 19) + variant + uuid.substring(20);

  return uuid;
}