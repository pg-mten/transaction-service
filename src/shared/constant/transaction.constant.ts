export enum TransactionUserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  MERCHANT = 'MERCHANT',
}

export enum ProviderName {
  INTERNAL = 'INTERNAL',
  PDN = 'PDN',
  INACASH = 'INACASH',
}

export const TransactionTypeEnum = {
  WITHDRAW: 'WITHDRAW',
  TOPUP: 'TOPUP',
  DISBURSEMENT: 'DISBURSEMENT',
  PURCHASE: 'PURCHASE',
  SETTLEMENT_PURCHASE: 'SETTLEMENT_PURCHASE',
};

export type TransactionTypeEnum =
  (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];
