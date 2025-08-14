import { PrismaClient } from '@prisma/client';
import { purchaseTransactionSeed } from './purchase-transaction.seed';
import { purchaseFeeDetailSeed } from './purchase-fee-detail.seed';

const prisma = new PrismaClient();

async function main() {
  await purchaseTransactionSeed(prisma);
  await purchaseFeeDetailSeed(prisma);
}

main()
  .catch((e) => {
    console.error('❌ Error while seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
