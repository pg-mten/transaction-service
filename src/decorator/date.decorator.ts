import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import { DateHelper } from 'src/shared/helper/date.helper';

/**
 * Transform a value into DateTime Nullable (Luxon)
 * @returns DateTime
 */
export function ToDateTimeNullable() {
  return Transform(({ value }) => {
    if (!value) return null;

    if (DateTime.isDateTime(value)) return value;

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt;

    throw new Error(`Invalid date value ${value}`);
  });
}

/**
 * Transform a value into DateTime (Luxon)
 * @returns DateTime
 */
export function ToDateTime() {
  return Transform(({ value }) => {
    if (value instanceof DateTime) return value;

    if (DateTime.isDateTime(value)) return value;

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt;

    throw new Error(`Invalid date value ${value}`);
  });
}
