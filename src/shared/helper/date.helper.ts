import { DateTime } from 'luxon';
import { TIMEZONE } from '../constant/global.constant';

export class DateHelper {
  static now(): DateTime {
    return DateTime.now().setZone(TIMEZONE);
  }

  static nowDate(): Date {
    return DateTime.now().setZone(TIMEZONE).toJSDate();
  }

  static fromISO(value: string): DateTime {
    return DateTime.fromISO(value, { zone: TIMEZONE });
  }

  static fromJsDate(date: Date | null): DateTime | null {
    if (!date) return null;
    return DateTime.fromJSDate(date);
  }
}
