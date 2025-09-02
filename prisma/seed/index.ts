import {
  PrismaClient,
  TransactionTypeEnum as BalanceReason,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // // === TOPUP TRANSACTIONS ===
  // await prisma.topUpTransaction.create({
  //   data: {
  //     merchantId: 1,
  //     externalId: 'EXT-TOPUP-001',
  //     referenceId: 'BANK-REF-TOPUP-001',
  //     nominal: 1000000,
  //     netNominal: 980000,
  //     providerName: 'NETZME',
  //     paymentMethodName: 'TRANSFER_BANK',
  //     receiptImage: 'https://dummy-receipt/1.png',
  //     status: 'SUCCESS',
  //     feeDetails: {
  //       create: [
  //         {
  //           agentId: 1,
  //           type: 'PROVIDER',
  //           nominal: 10000,
  //           isPercentage: false,
  //           fee: 10000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'INTERNAL',
  //           nominal: 5000,
  //           isPercentage: false,
  //           fee: 5000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'AGENT',
  //           nominal: 5000,
  //           isPercentage: false,
  //           fee: 5000,
  //         },
  //       ],
  //     },
  //     merchantBalanceLog: {
  //       create: {
  //         merchantId: 1,
  //         changeAmount: 980000,
  //         balanceActive: 980000,
  //         balancePending: 0,
  //         transactionType: BalanceReason.TOPUP,
  //       },
  //     },
  //   },
  // });

  // // === PURCHASE TRANSACTION ===
  // const purchase1 = await prisma.purchaseTransaction.create({
  //   data: {
  //     externalId: 'EXT-PURCHASE-001',
  //     merchantId: 1,
  //     referenceId: 'REF-PURCHASE-001',
  //     providerName: 'OVO',
  //     paymentMethodName: 'OVO_WALLET',
  //     nominal: 200000,
  //     netNominal: 194000,
  //     status: 'SUCCESS',
  //     feeDetails: {
  //       create: [
  //         {
  //           agentId: 1,
  //           type: 'PROVIDER',
  //           nominal: 3000,
  //           isPercentage: false,
  //           fee: 3000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'INTERNAL',
  //           nominal: 2000,
  //           isPercentage: false,
  //           fee: 2000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'AGENT',
  //           nominal: 1000,
  //           isPercentage: false,
  //           fee: 1000,
  //         },
  //       ],
  //     },
  //     MerchantBalanceLog: {
  //       create: {
  //         merchantId: 1,
  //         changeAmount: 194000,
  //         balanceActive: 980000, // tidak bertambah ke active
  //         balancePending: 194000, // pending dulu
  //         transactionType: BalanceReason.PURCHASE,
  //       },
  //     },
  //   },
  // });

  // // === PURCHASE SETTLEMENT ===
  // await prisma.merchantBalanceLog.create({
  //   data: {
  //     merchantId: 1,
  //     purchaseId: purchase1.id,
  //     changeAmount: 194000,
  //     balanceActive: 980000 + 194000, // masuk ke active
  //     balancePending: 0,
  //     transactionType: BalanceReason.SETTLEMENT_PURCHASE,
  //   },
  // });

  // // === DISBURSEMENT ===
  // await prisma.disbursementTransaction.create({
  //   data: {
  //     externalId: 'EXT-DISB-001',
  //     referenceId: 'BANK-REF-DISB-001',
  //     merchantId: 1,
  //     providerName: 'NETZME',
  //     recipientName: 'Merchant One',
  //     recipientBank: 'NETZME',
  //     recipientAccount: '1234567890',
  //     nominal: 500000,
  //     netNominal: 495000,
  //     status: 'SUCCESS',
  //     paymentMethodName: 'TRANSFER_BANK',
  //     feeDetails: {
  //       create: [
  //         {
  //           agentId: 1,
  //           type: 'PROVIDER',
  //           nominal: 3000,
  //           isPercentage: false,
  //           fee: 3000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'INTERNAL',
  //           nominal: 2000,
  //           isPercentage: false,
  //           fee: 2000,
  //         },
  //       ],
  //     },
  //     MerchantBalanceLog: {
  //       create: {
  //         merchantId: 1,
  //         changeAmount: -495000,
  //         balanceActive: 980000 + 194000 - 495000,
  //         balancePending: 0,
  //         transactionType: BalanceReason.DISBURSEMENT,
  //       },
  //     },
  //   },
  // });

  // // === WITHDRAW ===
  // await prisma.withdrawTransaction.create({
  //   data: {
  //     externalId: 'EXT-WD-001',
  //     merchantId: 1,
  //     referenceId: 'BANK-REF-WD-001',
  //     nominal: 300000,
  //     netNominal: 295000,
  //     providerName: 'NETZME',
  //     paymentMethodName: 'TRANSFER_BANK',
  //     status: 'SUCCESS',
  //     feeDetails: {
  //       create: [
  //         {
  //           agentId: 1,
  //           type: 'PROVIDER',
  //           nominal: 3000,
  //           isPercentage: false,
  //           fee: 3000,
  //         },
  //         {
  //           agentId: 1,
  //           type: 'INTERNAL',
  //           nominal: 2000,
  //           isPercentage: false,
  //           fee: 2000,
  //         },
  //       ],
  //     },
  //     MerchantBalanceLog: {
  //       create: {
  //         merchantId: 1,
  //         changeAmount: -295000,
  //         balanceActive: 980000 + 194000 - 495000 - 295000,
  //         balancePending: 0,
  //         transactionType: BalanceReason.WITHDRAW,
  //       },
  //     },
  //   },
  // });

  console.log('Seeder selesai 🚀');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
