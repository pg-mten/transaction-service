import { Transform } from 'class-transformer';
import Decimal from 'decimal.js';

/**
 * Transform a value into Decimal Nullable
 * @returns Decimal
 */
export function ToDecimalNullable() {
  return Transform(({ value }) => {
    if (!value) return null;
    if (value instanceof Decimal) return value;
    try {
      return new Decimal(value);
    } catch {
      throw new Error(`Invalid decimal value: ${value}`);
    }
  });
}

/**
 * Transform a value into Decimal
 * @returns Decimal
 */
export function ToDecimal() {
  return Transform(({ value }) => {
    if (value instanceof Decimal) return value;
    try {
      return new Decimal(value);
    } catch {
      throw new Error(`Invalid decimal value: ${value}`);
    }
  });
}

/**
 * Transform a Decimal into string with fixed 2
 * @returns string
 */
export function ToDecimalFixed() {
  return Transform(
    ({ value }) => {
      if (value === null || value === undefined || value === '') return null;

      if (!(value instanceof Decimal)) {
        try {
          value = new Decimal(value);
        } catch {
          throw new Error(`Invalid decimal value: ${value}`);
        }
      }

      return (value as Decimal).toFixed(2);
    },
    { toPlainOnly: true },
  );
}
