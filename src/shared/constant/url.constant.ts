import 'dotenv/config';

export const URL_AUTH = process.env.URL_AUTH || 'http://localhost:3000/api/v1';

export const URL_CONFIG =
  process.env.URL_CONFIG || 'http://localhost:3001/api/v1';

export const URL_TRANSACTION =
  process.env.URL_TRANSACTION || 'http://localhost:3002/api/v1';
