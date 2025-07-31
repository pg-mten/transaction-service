import 'dotenv/config';

export const APP_NAME = process.env.APP_NAME || 'PG';

export const VERSION = process.env.VERSION || 'v1';
export const API_PREFIX = `/api/${VERSION}`;

export const PORT: number = parseInt(process.env.PORT || '3000');

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test';
