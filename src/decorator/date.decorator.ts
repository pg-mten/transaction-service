import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import { DateHelper } from 'src/shared/helper/date.helper';

export function ToDateTimeJsDateNullable() {
  return Transform(({ value }) => {
    if (!value) return null;
    if (DateTime.isDateTime(value)) return value.toJSDate();

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt.toJSDate();

    throw new Error(`Invalid date value ${value}`);
  });
}

export function ToDateTimeJsDate() {
  return Transform(({ value }) => {
    if (DateTime.isDateTime(value)) return value.toJSDate();

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt.toJSDate();

    throw new Error(`Invalid date value ${value}`);
  });
}

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
