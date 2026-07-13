import { DateHelper } from './date.helper';
import { DateTime } from 'luxon';
import { UuidHelper } from './uuid.helper';
import { ApiError } from 'src/shared/exception';
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
    length = 30,
  }: Omit<CodeTransaction, 'date'> & { length?: number }): string {
    const tt = this.transactionTypeMapper(transactionType);
    const pn = this.providerNameMapper(providerName);
    const pmn = this.paymentMethodNameMapper(paymentMethodName);
    const nowMs = DateHelper.nowMs();

    // const code = `${userId}-${tt}-${pn}-${pmn}`;
    // const code = `${DateHelper.nowMs()}-${userId}-${tt}-${pmn}-${pn}`;
    const code = `${nowMs}${tt}${pmn}${pn}-${userId}`;

    if (code.length >= length - 1) return code;

    const random = UuidHelper.generateRandomCode();
    return `${code}-${random.slice(0, length - code.length - 1)}`;
  }

  static extractCode(code: string): CodeTransaction {
    // For Example: 1772001455392DTBPDNT1-13-[random]
    const match = code.match(
      /^(\d{13})([A-Z0-9])([A-Z0-9]{2})([A-Z0-9]{5})-(\d+)(?:-([A-Za-z0-9]+))?$/,
    );

    if (!match) {
      throw ApiError.callbackCodeInvalid();
    }

    const [, date, transactionType, paymentMethodName, providerName, userId] =
      match;
    const parsedUserId = Number(userId);
    const parsedDate = DateHelper.fromMs(date);

    if (!Number.isInteger(parsedUserId) || !parsedDate.isValid) {
      throw ApiError.callbackCodeInvalid();
    }

    return {
      userId: parsedUserId,
      transactionType: this.transactionType(transactionType),
      providerName: this.providerName(providerName),
      paymentMethodName: this.paymentMethodName(paymentMethodName),
      date: parsedDate,
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
    if (ProviderName.ZIPAY === providerName) return 'ZIPAY';
    if (ProviderName.PAKAIDONK === providerName) return 'PKDNK';
    return '0';
  }

  static providerName(value: string): ProviderName {
    if (value === 'INTER') return ProviderName.INTERNAL;
    if (value === 'PDNT1') return ProviderName.PDNT1;
    if (value === 'ZIPAY') return ProviderName.ZIPAY;
    if (value === 'PKDNK') return ProviderName.PAKAIDONK;
    return ProviderName.INTERNAL;
  } /// Pakaidonk

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
