import 'dotenv/config';

export const URL_AUTH = process.env.URL_AUTH || 'http://localhost:3000/api/v1';

export const URL_CONFIG =
  process.env.URL_CONFIG || 'http://localhost:3001/api/v1';

export const URL_TRANSACTION =
  process.env.URL_TRANSACTION || 'http://localhost:3002/api/v1';

export const URL_SETTLERECON =
  process.env.URL_SETTLERECON || 'http://localhost:3003/api/v1';

export const SERVICES = {
  APP: {
    name: process.env.APP_NAME || 'PG_SERVICE',
    host: process.env.APP_HOST || '127.0.0.1',
    port: parseInt(process.env.APP_PORT || '4000'),
  },
  AUTH: {
    name: process.env.CLIENT_AUTH_NAME || 'AUTH_SERVICE',
    host: process.env.CLIENT_AUTH_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_AUTH_PORT || '4000'),
    point: {
      find_all_merchants_and_agents_by_ids: {
        cmd: 'find_all_merchants_and_agents_by_ids',
        path: 'user/internal/merchants-and-agents-by-ids',
        url: `${URL_AUTH}/user/internal/merchants-and-agents-by-ids`,
      },
      find_profile_bank: {
        cmd: 'find_profile_bank',
        path: 'user/internal/profile-bank',
        url: `${URL_AUTH}/user/internal/profile-bank`,
      },
      merchant_signature_validation: {
        cmd: 'merchant_signature_validation',
        path: 'merchant-signature/internal/validate-signature',
        url: `${URL_AUTH}/merchant-signature/internal/validate-signature`,
      },
      merchant_signature_url: {
        cmd: 'merchant_signature_url',
        path: 'merchant-signature/internal/merchant-url',
        url: `${URL_AUTH}/merchant-signature/internal/merchant-url`,
      },
    },
  },
  CONFIG: {
    name: process.env.CLIENT_CONFIG_NAME || 'CONFIG_SERVICE',
    host: process.env.CLIENT_CONFIG_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_CONFIG_PORT || '4001'),
    point: {
      calculate_fee_purchase: {
        cmd: 'calculate_fee_purchase',
        path: 'fee/internal/purchase',
        url: `${URL_CONFIG}/fee/internal/purchase`,
      },
      calculate_fee_withdraw: {
        cmd: 'calculate_fee_withdraw',
        path: 'fee/internal/withdraw',
        url: `${URL_CONFIG}/fee/internal/withdraw`,
      },
      calculate_fee_topup: {
        cmd: 'calculate_fee_topup',
        path: 'fee/internal/topup',
        url: `${URL_CONFIG}/fee/internal/topup`,
      },
      calculate_fee_disbursement: {
        cmd: 'calculate_fee_disbursement',
        path: 'fee/internal/disbursement',
        url: `${URL_CONFIG}/fee/internal/disbursement`,
      },
      create_merchant_config: {
        cmd: 'create_merchant_config',
        path: 'merchant/internal',
        url: `${URL_CONFIG}/merchant/internal`,
      },
      create_agent_config: {
        cmd: 'create_agent_config',
        path: 'agent/internal',
        url: `${URL_CONFIG}/agent/internal`,
      },
      find_profile_provider: {
        cmd: 'find_profile_provider',
        path: 'user-provider/internal/profile-provider',
        url: `${URL_CONFIG}/user-provider/internal/profile-provider`,
      },
    },
  },
  TRANSACTION: {
    name: process.env.CLIENT_TRANSACTION_NAME || 'TRANSACTION_SERVICE',
    host: process.env.CLIENT_TRANSACTION_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_TRANSACTION_PORT || '4002'),
    point: {
      purchase_callback: {
        cmd: 'purchase_callback',
        path: 'transactions/purchase/internal/callback',
        url: `${URL_TRANSACTION}/transactions/purchase/internal/callback`,
      },
      withdraw_callback: {
        cmd: 'withdraw_callback',
        path: 'transactions/withdraw/internal/callback',
        url: `${URL_TRANSACTION}/transactions/withdraw/internal/callback`,
      },
      disbursement_callback: {
        cmd: 'disbursement_callback',
        path: 'transactions/disbursement/internal/callback',
        url: `${URL_TRANSACTION}/transactions/disbursement/internal/callback`,
      },
    },
  },
  SETTLERECON: {
    name: process.env.CLIENT_SETTLERECON_NAME || 'SETTLERECON_SERVICE',
    host: process.env.CLIENT_SETTLERECON_HOST || '127.0.0.1',
    port: parseInt(process.env.CLIENT_SETTLERECON_PORT || '4003'),
    point: {
      settlement_schedule: {
        cmd: 'settlement_schedule',
        path: 'settlement/internal',
        url: `${URL_SETTLERECON}/settlement/internal`,
      },
      inacash_purchase_qris: {
        cmd: 'inacash_purchase_qris',
        path: 'provider/inacash/internal/qris',
        url: `${URL_SETTLERECON}/provider/inacash/internal/qris`,
      },
      inacash_withdraw: {
        cmd: 'inacash_withdraw',
        path: 'provider/inacash/internal/withdraw',
        url: `${URL_SETTLERECON}/provider/inacash/internal/withdraw`,
      },
      inacash_disbursement: {
        cmd: 'inacash_disbursement',
        path: 'provider/inacash/internal/disbursement',
        url: `${URL_SETTLERECON}/provider/inacash/internal/disbursement`,
      },
      pdn_purchase_qris: {
        cmd: 'pdn_purchase_qris',
        path: 'provider/pdn/internal/qris',
        url: `${URL_SETTLERECON}/provider/pdn/internal/qris`,
      },
      pdn_withdraw: {
        cmd: 'pdn_withdraw',
        path: 'provider/pdn/internal/withdraw',
        url: `${URL_SETTLERECON}/provider/pdn/internal/withdraw`,
      },
      pdn_disbursement: {
        cmd: 'pdn_disbursement',
        path: 'provider/pdn/internal/disbursement',
        url: `${URL_SETTLERECON}/provider/pdn/internal/disbursement`,
      },
    },
  },
};
