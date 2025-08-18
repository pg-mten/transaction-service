import { PrismaClient, TransactionStatusEnum } from '@prisma/client';

function generateRandomString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomDouble(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getRandomEnumValue<T extends object>(enumObj: T): T[keyof T] {
  const values = Object.values(enumObj);
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex] as T[keyof T];
}

function getRandomDateTime(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

const providers = ['NETZME', 'DANA', 'ALIPAY', 'STICPAY'];

const paymentMethods = ['QRIS', 'GOPAY', 'OVO', 'BCA', 'MANDIRI', 'BRI'];

export async function purchaseTransactionSeed(prisma: PrismaClient) {
  for (let i = 1; i <= 2000; i++) {
    const purchaseTransaction = await prisma.purchaseTransaction.create({
      data: {
        externalId: generateRandomString(10) + i,
        referenceId: generateRandomString(10),
        merchantId: getRandomNumber(1, 100),
        providerName: providers[getRandomNumber(0, providers.length - 1)],
        paymentMethodName:
          paymentMethods[getRandomNumber(0, paymentMethods.length - 1)],
        nominal: getRandomDouble(100.0, 1000.0).toFixed(2),
        merchantNetNominal: getRandomDouble(100.0, 1000.0).toFixed(2),
        status: getRandomEnumValue(TransactionStatusEnum),
        metadata: {},
        createdAt: getRandomDateTime(
          new Date('2025-08-01T00:00:00Z'),
          new Date('2025-08-06T23:59:59Z'),
        ),
        updatedAt: getRandomDateTime(
          new Date('2025-08-01T00:00:00Z'),
          new Date('2025-08-07T23:59:59Z'),
        ),
      },
    });
    console.log(purchaseTransaction);
  }
}
