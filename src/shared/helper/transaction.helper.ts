import { DateHelper } from './date.helper';
import { DateTime } from 'luxon';
import { UuidHelper } from './uuid.helper';
import { TransactionTypeEnum } from '../constant/transaction.constant';

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
    const random = UuidHelper.generateRandomCode();
    const code = `${DateHelper.nowMs()}-${userId}-${transactionType}-${providerName}-${paymentMethodName}-${random}`;
    return code;
  }

  static extractCode(code: string): CodeTransaction {
    const [date, userId, transactionType, providerName, paymentMethodName] =
      code.split('-');
    return {
      transactionType: transactionType,
      userId: Number(userId),
      providerName,
      paymentMethodName,
      date: DateHelper.fromMs(date),
    };
  }
}
