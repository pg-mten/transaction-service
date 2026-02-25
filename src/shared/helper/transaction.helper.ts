import { DateHelper } from './date.helper';
import { DateTime } from 'luxon';
import { UuidHelper } from './uuid.helper';
import {
  PaymentMethodName,
  ProviderName,
  TransactionTypeEnum,
} from '../constant/transaction.constant';

interface CodeTransaction {
  transactionType: TransactionTypeEnum;
  userId: number;
  providerName: ProviderName;
  paymentMethodName: PaymentMethodName;
  date: DateTime;
}

export class TransactionHelper {
  static createCode({
    transactionType,
    userId,
    providerName,
    paymentMethodName,
  }: Omit<CodeTransaction, 'date'>): string {
    const tt = this.transactionTypeMapper(transactionType);
    const pn = this.providerNameMapper(providerName);
    const pmn = this.paymentMethodNameMapper(paymentMethodName);

    // const code = `${userId}-${tt}-${pn}-${pmn}`;
    // const code = `${DateHelper.nowMs()}-${userId}-${tt}-${pmn}-${pn}`;
    const code = `${DateHelper.nowMs()}${tt}${pmn}${pn}-${userId}`;

    if (code.length >= 29) return code;

    const random = UuidHelper.generateRandomCode();
    return `${code}-${random.slice(0, 30 - code.length - 1)}`;
  }

  static extractCode(code: string): CodeTransaction {
    // For Example: 1772001455392DTFPDNT1-13-[random]

    const date = code.slice(0, 13); // 1772001455392
    const transactionType = code.slice(13, 14); // D
    const paymentMethodName = code.slice(14, 16); // TF
    const providerName = code.slice(16, 21); // PDNT1
    const userId = code.split('-')[1]; // 13
    const random = code.split('-')[2]; // [random]
    console.log({ random });
    return {
      userId: Number(userId),
      transactionType: this.transactionType(transactionType),
      providerName: this.providerName(providerName),
      paymentMethodName: this.paymentMethodName(paymentMethodName),
      date: DateHelper.fromMs(date),
    };
  }

  static transactionTypeMapper(transactionType: TransactionTypeEnum): string {
    if (TransactionTypeEnum.PURCHASE === transactionType) return 'P';
    if (TransactionTypeEnum.TOPUP === transactionType) return 'T';
    if (TransactionTypeEnum.WITHDRAW === transactionType) return 'W';
    if (TransactionTypeEnum.DISBURSEMENT === transactionType) return 'D';
    if (TransactionTypeEnum.SETTLEMENT_PURCHASE === transactionType) return 'S';
    return '0';
  }

  static transactionType(value: string): TransactionTypeEnum {
    if ('P' === value) return TransactionTypeEnum.PURCHASE;
    if ('T' === value) return TransactionTypeEnum.TOPUP;
    if ('W' === value) return TransactionTypeEnum.WITHDRAW;
    if ('D' === value) return TransactionTypeEnum.DISBURSEMENT;
    if ('S' === value) return TransactionTypeEnum.SETTLEMENT_PURCHASE;
    else return TransactionTypeEnum.SETTLEMENT_PURCHASE;
  }

  /**
   * MUST BE 5 CHARACTER
   */
  static providerNameMapper(providerName: ProviderName): string {
    if (ProviderName.INTERNAL === providerName) return 'INTER';
    if (ProviderName.PDNT1 === providerName) return 'PDNT1';
    return '0';
  }

  static providerName(value: string): ProviderName {
    if (value === 'INTER') return ProviderName.INTERNAL;
    if (value === 'PDNT1') return ProviderName.PDNT1;
    return ProviderName.INTERNAL;
  }

  /**
   * MUST BE 2 CHARACTER
   */
  static paymentMethodNameMapper(paymentMethodName: PaymentMethodName): string {
    if (PaymentMethodName.QRIS === paymentMethodName) return 'QR';
    if (PaymentMethodName.VIRTUALACCOUNT === paymentMethodName) return 'VA';
    if (PaymentMethodName.DIRECTEWALLET === paymentMethodName) return 'DE';
    if (PaymentMethodName.TRANSFERBANK === paymentMethodName) return 'TB';
    if (PaymentMethodName.TRANSFEREWALLET === paymentMethodName) return 'TE';
    return '0';
  }

  static paymentMethodName(value: string): PaymentMethodName {
    if (value === 'QR') return PaymentMethodName.QRIS;
    if (value === 'VA') return PaymentMethodName.VIRTUALACCOUNT;
    if (value === 'DE') return PaymentMethodName.DIRECTEWALLET;
    if (value === 'TB') return PaymentMethodName.TRANSFERBANK;
    if (value === 'TE') return PaymentMethodName.TRANSFEREWALLET;
    return PaymentMethodName.QRIS;
  }
}
