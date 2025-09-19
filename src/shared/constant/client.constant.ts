import 'dotenv/config';

export const URL_AUTH = process.env.URL_AUTH || 'http://localhost:3000/api/v1';

export const URL_CONFIG =
  process.env.URL_CONFIG || 'http://localhost:3001/api/v1';

export const URL_TRANSACTION =
  process.env.URL_TRANSACTION || 'http://localhost:3002/api/v1';

export const URL_SETTLERECON =
  process.env.URL_SETTLERECON || 'http://localhost:3003/api/v1';

export const SERVICES = {
  AUTH: {
    name: process.env.CLIENT_AUTH_NAME || 'AUTH_SERVICE',
    host: process.env.CLIENT_AUTH_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_AUTH_HOST || '4000'),
    cmd: {
      find_all_merchants_and_agents_by_ids:
        'find_all_merchants_and_agents_by_ids',
    },
  },
  CONFIG: {
    name: process.env.CLIENT_CONFIG_NAME || 'CONFIG_SERVICE',
    host: process.env.CLIENT_CONFIG_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_CONFIG_HOST || '4001'),
    cmd: {
      calculate_fee_purchase: 'calculate_fee_purchase',
      calculate_fee_withdraw: 'calculate_fee_withdraw',
      calculate_fee_topup: 'calculate_fee_topup',
      calculate_fee_disbursement: 'calculate_fee_disbursement',
      create_merchant_config: 'create_merchant_config',
      create_agent_config: 'create_agent_config',
    },
  },
  TRANSACTION: {
    name: process.env.CLIENT_TRANSACTION_NAME || 'TRANSACTION_SERVICE',
    host: process.env.CLIENT_TRANSACTION_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_TRANSACTION_HOST || '4002'),
    cmd: {},
  },
  SETTLERECON: {
    name: process.env.CLIENT_SETTLERECON_NAME || 'SETTLERECON_SERVICE',
    host: process.env.CLIENT_SETTLERECON_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_SETTLERECON_HOST || '4003'),
    cmd: {
      settlement_schedule: 'settlement_schedule',
    },
  },
};
