import { TransactionTypeEnum } from '@prisma/client';
import { DateHelper } from './date.helper';
import { DateTime } from 'luxon';

interface CodeTransaction {
  transactionType: TransactionTypeEnum;
  userId: number;
  providerName: string;
  paymentMethodName: string;
  date: DateTime;
}

export class TransactionHelper {
  static createCode({
    transactionType,
    userId,
    providerName,
    paymentMethodName,
  }: Omit<CodeTransaction, 'date'>): string {
    const code = `${DateHelper.now().toUnixInteger()}-${userId}-${transactionType}-${providerName}-${paymentMethodName}`;
    return code;
  }

  static extractCode(code: string): CodeTransaction {
    const [date, userId, transactionType, providerName, paymentMethodName] =
      code.split('-');
    return {
      transactionType: transactionType as TransactionTypeEnum,
      userId: Number(userId),
      providerName,
      paymentMethodName,
      date: DateHelper.fromUnixInteger(date),
    };
  }
}
