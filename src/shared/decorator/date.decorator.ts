import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import { ApiError } from 'src/shared/exception';
import { DateHelper } from 'src/shared/helper/date.helper';

export function ToDateTimeJsDateNullable() {
  return Transform(({ value, key }) => {
    if (!value) return null;
    if (DateTime.isDateTime(value)) return value.toJSDate();

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt.toJSDate();

    throw ApiError.invalidDate(String(key), value);
  });
}

export function ToDateTimeJsDate() {
  return Transform(({ value, key }) => {
    if (DateTime.isDateTime(value)) return value.toJSDate();

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt.toJSDate();

    throw ApiError.invalidDate(String(key), value);
  });
}

/**
 * Transform a value into DateTime Nullable (Luxon)
 * @returns DateTime
 */
export function ToDateTimeNullable() {
  return Transform(({ value, key }) => {
    if (!value) return null;

    if (DateTime.isDateTime(value)) return value;

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt;

    throw ApiError.invalidDate(String(key), value);
  });
}

/**
 * Transform a value into DateTime (Luxon)
 * @returns DateTime
 */
export function ToDateTime() {
  return Transform(({ value, key }) => {
    if (value instanceof DateTime) return value;

    if (DateTime.isDateTime(value)) return value;

    const dt = DateHelper.fromISO(value);
    if (dt.isValid) return dt;

    throw ApiError.invalidDate(String(key), value);
  });
}
