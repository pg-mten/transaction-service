import Decimal from 'decimal.js';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export class CsvHelper {
  static build<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const headerLine = columns.map((column) => this.escape(column.header)).join(',');
    const dataLines = rows.map((row) =>
      columns
        .map((column) => this.escape(this.stringifyValue(column.value(row))))
        .join(','),
    );

    return [headerLine, ...dataLines].join('\n');
  }

  private static stringifyValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return this.sanitizeForSpreadsheet(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toISOString();
    if (Decimal.isDecimal(value)) return value.toString();
    if (this.isLuxonDateTime(value)) return value.toISO() ?? '';
    if (Array.isArray(value) || typeof value === 'object') {
      return this.sanitizeForSpreadsheet(
        JSON.stringify(value, (_key: string, val: unknown) => {
          if (val instanceof Date) return val.toISOString();
          if (Decimal.isDecimal(val)) return val.toString();
          if (this.isLuxonDateTime(val)) return val.toISO();
          return val;
        }),
      );
    }

    return String(value);
  }

  private static escape(rawValue: string): string {
    if (
      rawValue.includes(',') ||
      rawValue.includes('"') ||
      rawValue.includes('\n') ||
      rawValue.includes('\r')
    ) {
      return `"${rawValue.replace(/"/g, '""')}"`;
    }
    return rawValue;
  }

  private static sanitizeForSpreadsheet(rawValue: string): string {
    const trimmedValue = rawValue.trimStart();
    if (
      trimmedValue.startsWith('=') ||
      trimmedValue.startsWith('+') ||
      trimmedValue.startsWith('-') ||
      trimmedValue.startsWith('@')
    ) {
      return `'${rawValue}`;
    }

    return rawValue;
  }

  private static isLuxonDateTime(
    value: unknown,
  ): value is { isValid: boolean; toISO: () => string | null } {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as { isValid?: unknown; toISO?: unknown };
    return (
      typeof candidate.isValid === 'boolean' &&
      typeof candidate.toISO === 'function'
    );
  }
}
