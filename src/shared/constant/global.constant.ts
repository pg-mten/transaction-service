import 'dotenv/config';

export const APP_NAME = process.env.APP_NAME || 'PG';

export const VERSION = process.env.VERSION || 'v1';
export const API_PREFIX = `/api/${VERSION}`;

export const PORT: number = parseInt(process.env.PORT || '3000');

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test';

export const TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

export const URL_AUTH = process.env.URL_AUTH || 'http://localhost:3000/api/v1';
export const URL_CONFIG =
  process.env.URL_CONFIG || 'http://localhost:3001/api/v1';
