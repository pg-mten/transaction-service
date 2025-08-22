import { PrismaClient } from '@prisma/client';

function getRandomDouble(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function purchaseFeeDetailSeed(prisma: PrismaClient) {
  const purchaseTransactions = await prisma.purchaseTransaction.findMany();

  for (const purchase of purchaseTransactions) {
    const fees = await Promise.all([
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseId: purchase.id,
          type: 'INTERNAL',
          nominal: getRandomDouble(100.0, 1000.0).toFixed(2),
          isPercentage: true,
          fee: getRandomDouble(0, 10).toFixed(2),
        },
      }),
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseId: purchase.id,
          type: 'PROVIDER',
          nominal: getRandomDouble(100.0, 1000.0).toFixed(2),
          isPercentage: true,
          fee: getRandomDouble(0, 10).toFixed(2),
        },
      }),
      // TODO Salah seeder
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseId: purchase.id,
          type: 'AGENT',
          nominal: getRandomDouble(100.0, 1000.0).toFixed(2),
          isPercentage: true,
          fee: getRandomDouble(0, 10).toFixed(2),
        },
      }),
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseId: purchase.id,
          type: 'MERCHANT',
          nominal: getRandomDouble(100.0, 1000.0).toFixed(2),
          isPercentage: true,
          fee: getRandomDouble(0, 10).toFixed(2),
        },
      }),
    ]);
    console.log({ fees });
  }
}
