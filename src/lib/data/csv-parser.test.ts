/**
 * CSV Parser Tests
 *
 * Comprehensive test suite for CSV parsing functionality
 * with deterministic test data and validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CSVParser, parseCSVFile, analyzeCSV } from './csv-parser';
import type { CSVImportOptions } from '@/types/market-data';

describe('CSVParser', () => {
  const sampleCSVData = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,152.50,149.75,151.25,1000000
2023-01-04,151.25,153.00,150.50,152.75,950000
2023-01-05,152.75,154.25,151.50,153.50,1100000
2023-01-06,153.50,155.00,152.25,154.75,1200000
2023-01-09,154.75,156.50,153.75,155.25,1050000`;

  const invalidCSVData = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,149.00,152.50,151.25,1000000
2023-01-04,invalid,153.00,150.50,152.75,950000
2023-01-05,152.75,154.25,151.50,abc,1100000`;

  const noHeaderCSVData = `2023-01-03,150.00,152.50,149.75,151.25,1000000
2023-01-04,151.25,153.00,150.50,152.75,950000
2023-01-05,152.75,154.25,151.50,153.50,1100000`;

  const differentDateFormatCSV = `Date,Open,High,Low,Close,Volume
01/03/2023,150.00,152.50,149.75,151.25,1000000
01/04/2023,151.25,153.00,150.50,152.75,950000
01/05/2023,152.75,154.25,151.50,153.50,1100000`;

  describe('parseCSV', () => {
    it('should parse valid CSV data successfully', async () => {
      const result = await CSVParser.parseCSV(sampleCSVData, 'AAPL');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries!.data).toHaveLength(5);
      expect(result.rowsProcessed).toBe(5);
      expect(result.rowsSkipped).toBe(0);

      const firstDataPoint = result.timeSeries!.data[0];
      expect(firstDataPoint.date).toBe('2023-01-03');
      expect(firstDataPoint.open).toBe(150.00);
      expect(firstDataPoint.high).toBe(152.50);
      expect(firstDataPoint.low).toBe(149.75);
      expect(firstDataPoint.close).toBe(151.25);
      expect(firstDataPoint.volume).toBe(1000000);
    });

    it('should handle CSV without headers', async () => {
      const options: Partial<CSVImportOptions> = {
        hasHeader: false,
        columnMapping: {
          date: 0,
          open: 1,
          high: 2,
          low: 3,
          close: 4,
          volume: 5,
        },
      };

      const result = await CSVParser.parseCSV(noHeaderCSVData, 'AAPL', options);

      expect(result.success).toBe(true);
      expect(result.timeSeries!.data).toHaveLength(3);
    });

    it('should handle different date formats', async () => {
      const result = await CSVParser.parseCSV(differentDateFormatCSV, 'AAPL');

      expect(result.success).toBe(true);
      expect(result.timeSeries!.data[0].date).toBe('2023-01-03');
      expect(result.timeSeries!.data[1].date).toBe('2023-01-04');
    });

    it('should detect and handle invalid OHLC data', async () => {
      const result = await CSVParser.parseCSV(invalidCSVData, 'AAPL');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Check for various validation errors that might occur
      const hasValidationError = result.errors.some(error =>
        error.includes('High must be >= max(open, close, low)') ||
        error.includes('OHLC_VALIDATION_FAILED') ||
        error.includes('INVALID_DATA_TYPE') ||
        error.includes('Expected number, received nan')
      );
      expect(hasValidationError).toBe(true);
    });

    it('should sort data by date ascending', async () => {
      const unsortedCSV = `Date,Open,High,Low,Close,Volume
2023-01-05,152.75,154.25,151.50,153.50,1100000
2023-01-03,150.00,152.50,149.75,151.25,1000000
2023-01-04,151.25,153.00,150.50,152.75,950000`;

      const result = await CSVParser.parseCSV(unsortedCSV, 'AAPL');

      expect(result.success).toBe(true);
      expect(result.timeSeries!.data[0].date).toBe('2023-01-03');
      expect(result.timeSeries!.data[1].date).toBe('2023-01-04');
      expect(result.timeSeries!.data[2].date).toBe('2023-01-05');
    });

    it('should handle duplicate dates', async () => {
      const duplicateCSV = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,152.50,149.75,151.25,1000000
2023-01-03,151.00,153.00,150.00,152.00,1050000
2023-01-04,151.25,153.00,150.50,152.75,950000`;

      const result = await CSVParser.parseCSV(duplicateCSV, 'AAPL');

      expect(result.success).toBe(false);
      expect(result.errors.some(error =>
        error.includes('Duplicate date found')
      )).toBe(true);
    });

    it('should handle empty or invalid data', async () => {
      const emptyCSV = '';
      const result = await CSVParser.parseCSV(emptyCSV, 'AAPL');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate price ranges', async () => {
      const invalidPriceCSV = `Date,Open,High,Low,Close,Volume
2023-01-03,-150.00,152.50,149.75,151.25,1000000
2023-01-04,151.25,153.00,150.50,200000.00,950000`;

      const result = await CSVParser.parseCSV(invalidPriceCSV, 'AAPL');

      expect(result.success).toBe(false);
      // Check for price validation errors
      const hasPriceError = result.errors.some(error =>
        error.includes('too_small') ||
        error.includes('too_big') ||
        error.includes('Number must be greater than or equal to') ||
        error.includes('Number must be less than or equal to') ||
        error.includes('INVALID_PRICE_RANGE')
      );
      expect(hasPriceError).toBe(true);
    });

    it('should detect volume spikes', async () => {
      const volumeSpikeCSV = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,152.50,149.75,151.25,1000000
2023-01-04,151.25,153.00,150.50,152.75,1000000
2023-01-05,152.75,154.25,151.50,153.50,1000000
2023-01-06,153.50,155.00,152.25,154.75,15000000
2023-01-09,154.75,156.50,153.75,155.25,1000000`;

      const result = await CSVParser.parseCSV(volumeSpikeCSV, 'AAPL');

      // Should succeed but with warnings
      expect(result.success).toBe(true);
      expect(result.warnings.some(warning =>
        warning.includes('volume spike')
      )).toBe(true);
    });

    it('should create proper TimeSeries metadata', async () => {
      const result = await CSVParser.parseCSV(sampleCSVData, 'AAPL');

      expect(result.success).toBe(true);
      const metadata = result.timeSeries!.metadata;

      expect(metadata.symbol).toBe('AAPL');
      expect(metadata.dataSource).toBe('CSV_FILE');
      expect(metadata.interval).toBe('daily');
      expect(metadata.currency).toBe('USD');
      expect(metadata.timeZone).toBe('America/New_York');
      expect(metadata.lastRefreshed).toBeDefined();
    });
  });

  describe('detectDelimiter', () => {
    it('should detect comma delimiter', () => {
      const delimiter = CSVParser.detectDelimiter(sampleCSVData);
      expect(delimiter).toBe(',');
    });

    it('should detect semicolon delimiter', () => {
      const semicolonCSV = sampleCSVData.replace(/,/g, ';');
      const delimiter = CSVParser.detectDelimiter(semicolonCSV);
      expect(delimiter).toBe(';');
    });

    it('should detect tab delimiter', () => {
      const tabCSV = sampleCSVData.replace(/,/g, '\t');
      const delimiter = CSVParser.detectDelimiter(tabCSV);
      expect(delimiter).toBe('\t');
    });

    it('should default to comma if uncertain', () => {
      const ambiguousCSV = 'a,b;c\td|e';
      const delimiter = CSVParser.detectDelimiter(ambiguousCSV);
      expect(delimiter).toBe(',');
    });
  });

  describe('analyzeCSVStructure', () => {
    it('should correctly analyze CSV with headers', () => {
      const analysis = CSVParser.analyzeCSVStructure(sampleCSVData);

      expect(analysis.hasHeader).toBe(true);
      expect(analysis.delimiter).toBe(',');
      expect(analysis.expectedColumns).toBe(6);
      expect(analysis.sampleRows).toHaveLength(5);
    });

    it('should correctly analyze CSV without headers', () => {
      const analysis = CSVParser.analyzeCSVStructure(noHeaderCSVData);

      expect(analysis.hasHeader).toBe(false);
      expect(analysis.delimiter).toBe(',');
      expect(analysis.expectedColumns).toBe(6);
    });

    it('should throw error for insufficient data', () => {
      expect(() => {
        CSVParser.analyzeCSVStructure('single line');
      }).toThrow('Insufficient data for structure analysis');
    });
  });

  describe('Custom column mapping', () => {
    it('should handle custom column order', async () => {
      const customOrderCSV = `Symbol,Volume,Close,Low,High,Open,Date
AAPL,1000000,151.25,149.75,152.50,150.00,2023-01-03
AAPL,950000,152.75,150.50,153.00,151.25,2023-01-04`;

      const options: Partial<CSVImportOptions> = {
        columnMapping: {
          date: 'Date',
          open: 'Open',
          high: 'High',
          low: 'Low',
          close: 'Close',
          volume: 'Volume',
        },
      };

      const result = await CSVParser.parseCSV(customOrderCSV, 'AAPL', options);

      expect(result.success).toBe(true);
      expect(result.timeSeries!.data).toHaveLength(2);
      expect(result.timeSeries!.data[0].date).toBe('2023-01-03');
    });

    it('should handle numeric column mapping', async () => {
      const options: Partial<CSVImportOptions> = {
        hasHeader: false,
        columnMapping: {
          date: 0,
          open: 1,
          high: 2,
          low: 3,
          close: 4,
          volume: 5,
        },
      };

      const result = await CSVParser.parseCSV(noHeaderCSVData, 'AAPL', options);

      expect(result.success).toBe(true);
      expect(result.timeSeries!.data).toHaveLength(3);
    });
  });

  describe('Performance and error handling', () => {
    it('should handle large datasets efficiently', async () => {
      // Generate larger dataset
      const largeCSV = ['Date,Open,High,Low,Close,Volume'];
      for (let i = 0; i < 1000; i++) {
        const date = new Date(2023, 0, i + 1).toISOString().split('T')[0];
        const basePrice = 150 + (i * 0.1);
        largeCSV.push(
          `${date},${basePrice},${basePrice + 2},${basePrice - 1},${basePrice + 1},${1000000 + i * 1000}`
        );
      }

      const startTime = performance.now();
      const result = await CSVParser.parseCSV(largeCSV.join('\n'), 'AAPL');
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.timeSeries!.data).toHaveLength(1000);
    });

    it('should gracefully handle malformed CSV', async () => {
      const malformedCSV = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,152.50,"broken quote,151.25,1000000
2023-01-04,151.25,153.00,150.50,152.75`;

      const result = await CSVParser.parseCSV(malformedCSV, 'AAPL');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Convenience functions', () => {
  const sampleData = `Date,Open,High,Low,Close,Volume
2023-01-03,150.00,152.50,149.75,151.25,1000000`;

  it('parseCSVFile should work as wrapper', async () => {
    const result = await parseCSVFile(sampleData, 'AAPL');
    expect(result.success).toBe(true);
  });

  it('analyzeCSV should work as wrapper', () => {
    const analysis = analyzeCSV(sampleData);
    expect(analysis.hasHeader).toBe(true);
    expect(analysis.delimiter).toBe(',');
  });
});