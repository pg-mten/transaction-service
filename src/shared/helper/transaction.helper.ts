import { TransactionTypeEnum } from '@prisma/client';
import { DateHelper } from './date.helper';
import { DateTime } from 'luxon';

interface CodeTransaction {
  transactionType: TransactionTypeEnum;
  merchantId: number;
  providerName: string;
  paymentMethodName: string;
  date: DateTime;
}

export class TransactionHelper {
  static createCode({
    transactionType,
    merchantId,
    providerName,
    paymentMethodName,
  }: Omit<CodeTransaction, 'date'>): string {
    const code = `${DateHelper.now().toUnixInteger()}-${merchantId}-${transactionType}-${providerName}-${paymentMethodName}`;
    return code;
  }

  static extractCode(code: string): CodeTransaction {
    const [date, merchantId, transactionType, providerName, paymentMethodName] =
      code;
    return {
      transactionType: transactionType as TransactionTypeEnum,
      merchantId: Number(merchantId),
      providerName,
      paymentMethodName,
      date: DateHelper.fromUnixInteger(date),
    };
  }
}
