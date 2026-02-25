export enum TransactionUserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  MERCHANT = 'MERCHANT',
}

export enum ProviderName {
  INTERNAL = 'INTERNAL',
  PDNT1 = 'PDNT1',
}

export enum PaymentMethodName {
  QRIS = 'QRIS',
  VIRTUALACCOUNT = 'VIRTUALACCOUNT',
  DIRECTEWALLET = 'DIRECTEWALLET',
  TRANSFERBANK = 'TRANSFERBANK',
  TRANSFEREWALLET = 'TRANSFEREWALLET',
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
