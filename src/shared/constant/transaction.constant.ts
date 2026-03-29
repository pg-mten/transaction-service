export enum TransactionUserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  MERCHANT = 'MERCHANT',
}

export const ProviderName = {
  INTERNAL: 'INTERNAL',
  PDNT1: 'PDNT1',
  ZIPAY: 'ZIPAY',
};

export type ProviderName = (typeof ProviderName)[keyof typeof ProviderName];

export const PaymentMethodName = {
  QRIS: 'QRIS',
  VIRTUALACCOUNT: 'VIRTUALACCOUNT',
  DIRECTEWALLET: 'DIRECTEWALLET',
  TRANSFERBANK: 'TRANSFERBANK',
  TRANSFEREWALLET: 'TRANSFEREWALLET',
};

export type PaymentMethodName =
  (typeof PaymentMethodName)[keyof typeof PaymentMethodName];

export const TransactionTypeEnum = {
  WITHDRAW: 'WITHDRAW',
  TOPUP: 'TOPUP',
  DISBURSEMENT: 'DISBURSEMENT',
  PURCHASE: 'PURCHASE',
  SETTLEMENT_PURCHASE: 'SETTLEMENT_PURCHASE',
};

export type TransactionTypeEnum =
  (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];
