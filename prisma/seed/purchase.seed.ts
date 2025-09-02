import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

export async function purchaseSeed(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.purchaseTransaction.create({
      data: {
        referenceId: 'REF-PURCHASE-001',
        externalId: 'EXT-PURCHASE-001',
        merchantId: 1,
        providerName: 'NETZME',
        paymentMethodName: 'QRIS',
        nominal: new Decimal(1000000),
        netNominal: new Decimal(980000),
        status: 'SUCCESS',
        feeDetails: {
          create: [
            {
              type: 'PROVIDER',
              nominal: new Decimal(10000),
              feeFixed: new Decimal(10000),
              feePercentage: new Decimal(0),
            },
            {
              type: 'INTERNAL',
              nominal: new Decimal(10000),
              feeFixed: new Decimal(10000),
              feePercentage: new Decimal(0),
            },
          ],
        },
      },
    }),
  ]);
}
