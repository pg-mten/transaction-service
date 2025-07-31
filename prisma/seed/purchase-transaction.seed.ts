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

export async function purchaseTransactionSeed(prisma: PrismaClient) {
  for (let i = 1; i <= 2000; i++) {
    const purchaseTransaction = await prisma.purchaseTransaction.create({
      data: {
        external_id: generateRandomString(10) + i,
        reference_id: generateRandomString(10),
        merchant_id: getRandomNumber(1, 100),
        provider_id: getRandomNumber(1, 10),
        agent_id: getRandomNumber(1, 100),
        amount: getRandomDouble(100.0, 1000.0),
        net_amount: getRandomDouble(100.0, 1000.0),
        status: getRandomEnumValue(TransactionStatusEnum),
        method: generateRandomString(10),
        metadata: {},
        created_at: getRandomDateTime(
          new Date('2025-08-01T00:00:00Z'),
          new Date('2025-08-06T23:59:59Z'),
        ),
        updated_at: getRandomDateTime(
          new Date('2025-08-01T00:00:00Z'),
          new Date('2025-08-07T23:59:59Z'),
        ),
      },
    });
    console.log(purchaseTransaction);
  }
}
