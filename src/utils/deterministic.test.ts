/**
 * Tests for deterministic utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { seededRandom, getDeterministicTimestamp, simpleHash } from './deterministic';
import { RANDOM_SEED } from '@/constants';

describe('Deterministic Utilities', () => {
  beforeEach(() => {
    // Reset the seeded random generator before each test
    seededRandom.reset(RANDOM_SEED);
  });

  describe('SeededRandom', () => {
    it('should generate the same sequence of numbers with the same seed', () => {
      const sequence1: number[] = [];
      const sequence2: number[] = [];

      // Generate first sequence
      for (let i = 0; i < 10; i++) {
        sequence1.push(seededRandom.next());
      }

      // Reset and generate second sequence
      seededRandom.reset(RANDOM_SEED);
      for (let i = 0; i < 10; i++) {
        sequence2.push(seededRandom.next());
      }

      expect(sequence1).toEqual(sequence2);
    });

    it('should generate numbers between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = seededRandom.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate numbers in specified range', () => {
      const min = 10;
      const max = 20;

      for (let i = 0; i < 100; i++) {
        const value = seededRandom.range(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });
  });

  describe('simpleHash', () => {
    it('should generate the same hash for the same input', () => {
      const input = 'test-string';
      const hash1 = simpleHash(input);
      const hash2 = simpleHash(input);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = simpleHash('string1');
      const hash2 = simpleHash('string2');

      expect(hash1).not.toBe(hash2);
    });

    it('should always return positive numbers', () => {
      const inputs = ['test', 'another', 'hash', 'function'];

      inputs.forEach(input => {
        const hash = simpleHash(input);
        expect(hash).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getDeterministicTimestamp', () => {
    it('should return a valid ISO timestamp', () => {
      const timestamp = getDeterministicTimestamp();

      // Should be able to parse as a valid date
      expect(() => new Date(timestamp)).not.toThrow();

      // Should be in ISO format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});