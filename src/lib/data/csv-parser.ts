/**
 * CSV Data Parser with Validation
 *
 * Deterministic CSV parsing for financial market data with comprehensive
 * validation, error handling, and data cleaning capabilities.
 */

import { z } from 'zod';
import { parse as csvParse } from 'csv-parse/sync';
import { log } from '@/lib/logger';
import {
  csvImportOptionsSchema,
  timeSeriesSchema,
  ohlcvDataSchema,
  dataValidationResultSchema,
  dataValidationErrorSchema,
  dataValidationWarningSchema,
} from '@/schemas/validation';
import type {
  CSVImportOptions,
  CSVImportResult,
  TimeSeries,
  TimeSeriesMetadata,
  OHLCVData,
  DataValidationResult,
  DataValidationError,
  DataValidationWarning,
  ValidationErrorType,
  ValidationWarningType,
} from '@/types/market-data';
import { VALIDATION_SETTINGS } from '@/constants';

/**
 * Parses CSV data into validated TimeSeries format
 */
export class CSVParser {
  private static readonly DEFAULT_OPTIONS: CSVImportOptions = {
    hasHeader: true,
    delimiter: ',',
    dateFormat: 'YYYY-MM-DD',
    columnMapping: {
      date: 'Date',
      open: 'Open',
      high: 'High',
      low: 'Low',
      close: 'Close',
      volume: 'Volume',
    },
  };

  /**
   * Parse CSV content into TimeSeries with validation
   */
  static async parseCSV(
    content: string,
    symbol: string,
    options: Partial<CSVImportOptions> = {}
  ): Promise<CSVImportResult> {
    const startTime = performance.now();
    log.info('Starting CSV parsing', { symbol, contentLength: content.length });

    try {
      // Validate and merge options
      const parsedOptions = this.validateOptions({ ...this.DEFAULT_OPTIONS, ...options });

      // Parse CSV content
      const rawData = this.parseCSVContent(content, parsedOptions);

      // Transform to OHLCV format
      const ohlcvData = this.transformToOHLCV(rawData, parsedOptions);

      // Validate data
      const validationResult = this.validateData(ohlcvData, symbol);

      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors.map(e => e.message),
          warnings: validationResult.warnings.map(w => w.message),
          rowsProcessed: 0,
          rowsSkipped: rawData.length,
        };
      }

      // Create TimeSeries
      const timeSeries = this.createTimeSeries(
        symbol,
        validationResult.cleanedData?.data || ohlcvData,
        parsedOptions
      );

      const duration = performance.now() - startTime;
      log.performance('CSV parsing completed', {
        symbol,
        duration,
        rowsProcessed: ohlcvData.length,
        warnings: validationResult.warnings.length
      });

      return {
        success: true,
        timeSeries,
        errors: [],
        warnings: validationResult.warnings.map(w => w.message),
        rowsProcessed: ohlcvData.length,
        rowsSkipped: 0,
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      log.error('CSV parsing failed', { symbol, duration, error });

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        warnings: [],
        rowsProcessed: 0,
        rowsSkipped: 0,
      };
    }
  }

  /**
   * Validate CSV import options
   */
  private static validateOptions(options: CSVImportOptions): CSVImportOptions {
    try {
      return csvImportOptionsSchema.parse(options);
    } catch (error) {
      log.error('Invalid CSV options', { error });
      throw new Error('Invalid CSV import options');
    }
  }

  /**
   * Parse raw CSV content into array of records
   */
  private static parseCSVContent(content: string, options: CSVImportOptions): any[] {
    try {
      const records = csvParse(content, {
        delimiter: options.delimiter,
        skip_empty_lines: true,
        from_line: options.skipRows ? options.skipRows + 1 : 1,
        to_line: options.maxRows ? options.maxRows + (options.skipRows || 0) : undefined,
        columns: options.hasHeader,
        trim: true,
        relaxQuotes: true,
      });

      log.info('CSV content parsed', { records: records.length });
      return records;
    } catch (error) {
      log.error('CSV parsing failed', { error });
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform raw CSV records to OHLCV format
   */
  private static transformToOHLCV(
    records: any[],
    options: CSVImportOptions
  ): OHLCVData[] {
    const ohlcvData: OHLCVData[] = [];
    const { columnMapping } = options;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        const dateValue = this.extractValue(record, columnMapping.date);
        const openValue = this.extractValue(record, columnMapping.open);
        const highValue = this.extractValue(record, columnMapping.high);
        const lowValue = this.extractValue(record, columnMapping.low);
        const closeValue = this.extractValue(record, columnMapping.close);
        const volumeValue = this.extractValue(record, columnMapping.volume);

        if (!dateValue || !openValue || !highValue || !lowValue || !closeValue || !volumeValue) {
          throw new Error('Missing required data fields');
        }

        const ohlcv: OHLCVData = {
          date: dateValue,
          open: parseFloat(openValue),
          high: parseFloat(highValue),
          low: parseFloat(lowValue),
          close: parseFloat(closeValue),
          volume: parseInt(volumeValue, 10),
          ...(columnMapping.adjustedClose && {
            adjustedClose: parseFloat(this.extractValue(record, columnMapping.adjustedClose))
          }),
        };

        // Validate date format
        ohlcv.date = this.normalizeDate(ohlcv.date);

        ohlcvData.push(ohlcv);
      } catch (error) {
        log.warn('Skipping invalid record', { index: i, record, error });
      }
    }

    // Sort by date ascending
    ohlcvData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    log.info('OHLCV transformation completed', {
      inputRecords: records.length,
      outputRecords: ohlcvData.length
    });

    return ohlcvData;
  }

  /**
   * Extract value from record using column mapping
   */
  private static extractValue(record: any, column: number | string): string {
    if (typeof column === 'number') {
      return record[column]?.toString() || '';
    }
    return record[column]?.toString() || '';
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private static normalizeDate(dateStr: string): string {
    // Try different date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];

    dateStr = dateStr.trim();

    // Already in correct format
    if (formats[0].test(dateStr)) {
      return dateStr;
    }

    // Convert MM/DD/YYYY
    if (formats[1].test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Convert MM-DD-YYYY
    if (formats[2].test(dateStr)) {
      const [month, day, year] = dateStr.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try parsing as Date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    throw new Error(`Invalid date format: ${dateStr}`);
  }

  /**
   * Validate OHLCV data with comprehensive checks
   */
  private static validateData(data: OHLCVData[], symbol: string): DataValidationResult {
    const errors: DataValidationError[] = [];
    const warnings: DataValidationWarning[] = [];
    const cleanedData: OHLCVData[] = [];

    if (data.length === 0) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        message: 'No valid data records found',
      });

      return { isValid: false, errors, warnings };
    }

    const seenDates = new Set<string>();
    let previousClose: number | null = null;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordErrors: DataValidationError[] = [];

      try {
        // Validate using Zod schema
        const validatedRecord = ohlcvDataSchema.parse(record);

        // Check for duplicate dates
        if (seenDates.has(record.date)) {
          recordErrors.push({
            type: 'DUPLICATE_DATE',
            message: `Duplicate date found: ${record.date}`,
            field: 'date',
            value: record.date,
            index: i,
          });
        }
        seenDates.add(record.date);

        // Check OHLC consistency
        if (record.high < Math.max(record.open, record.close, record.low)) {
          recordErrors.push({
            type: 'OHLC_VALIDATION_FAILED',
            message: 'High price is less than max(open, close, low)',
            index: i,
          });
        }

        if (record.low > Math.min(record.open, record.close, record.high)) {
          recordErrors.push({
            type: 'OHLC_VALIDATION_FAILED',
            message: 'Low price is greater than min(open, close, high)',
            index: i,
          });
        }

        // Check for large price movements
        if (previousClose !== null) {
          const priceChange = Math.abs(record.open - previousClose) / previousClose;
          if (priceChange > VALIDATION_SETTINGS.MAX_DAILY_PRICE_CHANGE) {
            warnings.push({
              type: 'LARGE_PRICE_MOVEMENT',
              message: `Large price gap detected: ${(priceChange * 100).toFixed(2)}%`,
              field: 'open',
              value: record.open,
              index: i,
            });
          }
        }

        // Check for volume spikes
        if (i > 0) {
          const avgVolume = cleanedData.slice(Math.max(0, cleanedData.length - 20))
            .reduce((sum, r) => sum + r.volume, 0) / Math.min(20, cleanedData.length);

          if (record.volume > avgVolume * VALIDATION_SETTINGS.VOLUME_SPIKE_THRESHOLD) {
            warnings.push({
              type: 'UNUSUAL_VOLUME_SPIKE',
              message: 'Unusual volume spike detected',
              field: 'volume',
              value: record.volume,
              index: i,
            });
          }
        }

        // If no errors for this record, add to cleaned data
        if (recordErrors.length === 0) {
          cleanedData.push(validatedRecord);
          previousClose = record.close;
        } else {
          errors.push(...recordErrors);
        }

      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          zodError.errors.forEach(error => {
            errors.push({
              type: 'INVALID_DATA_TYPE',
              message: `${error.path.join('.')}: ${error.message}`,
              field: error.path.join('.'),
              value: error.code,
              index: i,
            });
          });
        }
      }
    }

    // Check for data gaps (missing trading days)
    this.checkForDataGaps(cleanedData, warnings);

    // Validation summary
    const isValid = errors.length === 0 && cleanedData.length > 0;

    log.info('Data validation completed', {
      symbol,
      totalRecords: data.length,
      validRecords: cleanedData.length,
      errors: errors.length,
      warnings: warnings.length,
      isValid,
    });

    return {
      isValid,
      errors,
      warnings,
      cleanedData: isValid ? this.createTimeSeries(symbol, cleanedData, this.DEFAULT_OPTIONS) : undefined,
    };
  }

  /**
   * Check for missing trading days
   */
  private static checkForDataGaps(data: OHLCVData[], warnings: DataValidationWarning[]): void {
    if (data.length < 2) return;

    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i - 1].date);
      const currDate = new Date(data[i].date);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      // Check for gaps > 3 days (weekend + holiday)
      if (daysDiff > VALIDATION_SETTINGS.MAX_DATA_GAP_DAYS) {
        warnings.push({
          type: 'DATA_GAP_DETECTED',
          message: `Data gap of ${daysDiff} days detected`,
          field: 'date',
          value: `${data[i - 1].date} to ${data[i].date}`,
          index: i,
        });
      }
    }
  }

  /**
   * Create TimeSeries object with metadata
   */
  private static createTimeSeries(
    symbol: string,
    data: OHLCVData[],
    options: CSVImportOptions
  ): TimeSeries {
    const metadata: TimeSeriesMetadata = {
      symbol: symbol.toUpperCase(),
      currency: 'USD', // Default assumption
      timeZone: 'America/New_York', // Default to NYSE timezone
      lastRefreshed: new Date().toISOString(),
      dataSource: 'CSV_FILE',
      interval: 'daily', // Default assumption
      outputSize: 'full',
    };

    return {
      symbol: symbol.toUpperCase(),
      data,
      metadata,
    };
  }

  /**
   * Utility: Detect CSV delimiter
   */
  static detectDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const sampleLines = sample.split('\n').slice(0, 5);

    let bestDelimiter = ',';
    let maxColumns = 0;

    for (const delimiter of delimiters) {
      const columnCounts = sampleLines.map(line =>
        line.split(delimiter).length
      );

      const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
      const consistency = columnCounts.every(count => count === columnCounts[0]);

      if (consistency && avgColumns > maxColumns && avgColumns >= 5) {
        maxColumns = avgColumns;
        bestDelimiter = delimiter;
      }
    }

    log.info('Delimiter detection completed', {
      detected: bestDelimiter,
      expectedColumns: maxColumns
    });

    return bestDelimiter;
  }

  /**
   * Utility: Analyze CSV structure
   */
  static analyzeCSVStructure(sample: string): {
    hasHeader: boolean;
    delimiter: string;
    expectedColumns: number;
    sampleRows: string[];
  } {
    const delimiter = this.detectDelimiter(sample);
    const lines = sample.split('\n').filter(line => line.trim()).slice(0, 5);

    if (lines.length < 2) {
      throw new Error('Insufficient data for structure analysis');
    }

    // Check if first row contains headers (non-numeric values)
    const firstRowCells = lines[0].split(delimiter);
    const hasHeader = firstRowCells.some(cell =>
      isNaN(parseFloat(cell.trim())) && cell.trim().length > 0
    );

    return {
      hasHeader,
      delimiter,
      expectedColumns: firstRowCells.length,
      sampleRows: lines,
    };
  }
}

/**
 * Convenience function for basic CSV parsing
 */
export const parseCSVFile = async (
  content: string,
  symbol: string,
  options?: Partial<CSVImportOptions>
): Promise<CSVImportResult> => {
  return CSVParser.parseCSV(content, symbol, options);
};

/**
 * Convenience function for CSV structure analysis
 */
export const analyzeCSV = (sample: string) => {
  return CSVParser.analyzeCSVStructure(sample);
};