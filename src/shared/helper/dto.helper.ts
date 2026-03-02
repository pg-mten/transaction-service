import Decimal from 'decimal.js';

export class DtoHelper {
  /**
   * Converts Decimal instances in an object to plain numbers (recursively).
   * Needed before signature validation because JSON.stringify calls toJSON()
   * on Decimal, producing a string instead of a number — which causes hash mismatches.
   */
  static convertDecimalToNumber(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v instanceof Decimal) {
        result[k] = v.toNumber();
      } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        result[k] = DtoHelper.convertDecimalToNumber(
          v as Record<string, unknown>,
        );
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  static assign<T extends object>(target: T, source: T): void {
    const allowedKeys = Object.keys(target) as (keyof T)[];
    for (const key of allowedKeys) {
      if (key in source) {
        target[key] = source[key];
      }
    }
  }

  static filter<T extends object>(dto: T) {
    return Object.fromEntries(
      Object.entries(dto).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, value]) => value !== null && value !== undefined,
      ),
    ) as Partial<T>;
  }
}
