import { PrismaClient } from '@prisma/client';

function getRandomDouble(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export async function feeDetailSeed(prisma: PrismaClient) {
  const purchaseTransactions = await prisma.purchaseTransaction.findMany();

  await Promise.all(
    purchaseTransactions.map((purchase) => {
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseTransactionId: purchase.id,
          type: 'INTERNAL',
          amount: getRandomDouble(100.0, 1000.0).toFixed(2),
          percentage: getRandomDouble(0, 10).toFixed(2),
        },
      });
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseTransactionId: purchase.id,
          type: 'PROVIDER',
          amount: getRandomDouble(100.0, 1000.0).toFixed(2),
          percentage: getRandomDouble(0, 10).toFixed(2),
        },
      });
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseTransactionId: purchase.id,
          type: 'AGENT',
          amount: purchase.amount,
          percentage: getRandomDouble(0, 10),
        },
      });
      prisma.purchaseFeeDetail.create({
        data: {
          purchaseTransactionId: purchase.id,
          type: 'MERCHANT',
          amount: purchase.amount,
          percentage: getRandomDouble(0, 10),
        },
      });
    }),
  );
}
