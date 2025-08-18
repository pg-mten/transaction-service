import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // === TOPUP TRANSACTIONS (5) ===
  await prisma.topUpTransaction.create({
    data: {
      merchantId: 1,
      externalId: 'EXT-TOPUP-001',
      referenceId: 'BANK-REF-TOPUP-001',
      nominal: 1000000,
      netNominal: 980000,
      providerName: 'BCA',
      paymentMethod: 'TRANSFER_BANK',
      receiptImage: 'https://dummy-receipt/1.png',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 10000,
            isPercentage: false,
            fee: 10000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
        ],
      },
    },
  });

  await prisma.topUpTransaction.create({
    data: {
      merchantId: 2,
      externalId: 'EXT-TOPUP-002',
      referenceId: 'BANK-REF-TOPUP-002',
      nominal: 2000000,
      netNominal: 1960000,
      providerName: 'MANDIRI',
      paymentMethod: 'TRANSFER_BANK',
      receiptImage: 'https://dummy-receipt/2.png',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 2,
            type: 'PROVIDER',
            nominal: 15000,
            isPercentage: false,
            fee: 15000,
          },
          {
            agentId: 2,
            type: 'INTERNAL',
            nominal: 4000,
            isPercentage: false,
            fee: 4000,
          },
          {
            agentId: 2,
            type: 'AGENT',
            nominal: 6000,
            isPercentage: false,
            fee: 6000,
          },
        ],
      },
    },
  });

  await prisma.topUpTransaction.create({
    data: {
      merchantId: 1,
      externalId: 'EXT-TOPUP-003',
      referenceId: 'BANK-REF-TOPUP-003',
      nominal: 1500000,
      netNominal: 1470000,
      providerName: 'BNI',
      paymentMethod: 'TRANSFER_BANK',
      receiptImage: 'https://dummy-receipt/3.png',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 12000,
            isPercentage: false,
            fee: 12000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
        ],
      },
    },
  });

  await prisma.topUpTransaction.create({
    data: {
      merchantId: 2,
      externalId: 'EXT-TOPUP-004',
      referenceId: 'BANK-REF-TOPUP-004',
      nominal: 500000,
      netNominal: 490000,
      providerName: 'BRI',
      paymentMethod: 'TRANSFER_BANK',
      receiptImage: 'https://dummy-receipt/4.png',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 2,
            type: 'PROVIDER',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
          {
            agentId: 2,
            type: 'INTERNAL',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
          {
            agentId: 2,
            type: 'AGENT',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
        ],
      },
    },
  });

  await prisma.topUpTransaction.create({
    data: {
      merchantId: 1,
      externalId: 'EXT-TOPUP-005',
      referenceId: 'BANK-REF-TOPUP-005',
      nominal: 3000000,
      netNominal: 2940000,
      providerName: 'CIMB',
      paymentMethod: 'TRANSFER_BANK',
      receiptImage: 'https://dummy-receipt/5.png',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 20000,
            isPercentage: false,
            fee: 20000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 10000,
            isPercentage: false,
            fee: 10000,
          },
        ],
      },
    },
  });

  // === PURCHASE TRANSACTIONS (5) ===
  await prisma.purchaseTransaction.create({
    data: {
      externalId: 'EXT-PURCHASE-001',
      merchantId: 1,
      referenceId: 'REF-PURCHASE-001',
      providerName: 'OVO',
      paymentMethodName: 'OVO-WALLET',
      nominal: 200000,
      netNominal: 194000,
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 1000,
            isPercentage: false,
            fee: 1000,
          },
        ],
      },
    },
  });

  await prisma.purchaseTransaction.create({
    data: {
      externalId: 'EXT-PURCHASE-002',
      merchantId: 2,
      referenceId: 'REF-PURCHASE-002',
      providerName: 'GOPAY',
      paymentMethodName: 'GOPAY-WALLET',
      nominal: 300000,
      netNominal: 291000,
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 2,
            type: 'PROVIDER',
            nominal: 4000,
            isPercentage: false,
            fee: 4000,
          },
          {
            agentId: 2,
            type: 'INTERNAL',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 2,
            type: 'AGENT',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
        ],
      },
    },
  });

  await prisma.purchaseTransaction.create({
    data: {
      externalId: 'EXT-PURCHASE-003',
      merchantId: 1,
      referenceId: 'REF-PURCHASE-003',
      providerName: 'DANA',
      paymentMethodName: 'DANA-WALLET',
      nominal: 150000,
      netNominal: 146000,
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 1000,
            isPercentage: false,
            fee: 1000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 1000,
            isPercentage: false,
            fee: 1000,
          },
        ],
      },
    },
  });

  await prisma.purchaseTransaction.create({
    data: {
      externalId: 'EXT-PURCHASE-004',
      merchantId: 2,
      referenceId: 'REF-PURCHASE-004',
      providerName: 'SHOPEEPAY',
      paymentMethodName: 'SHOPEEPAY-WALLET',
      nominal: 250000,
      netNominal: 244000,
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 2,
            type: 'PROVIDER',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 2,
            type: 'INTERNAL',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
          {
            agentId: 2,
            type: 'AGENT',
            nominal: 1000,
            isPercentage: false,
            fee: 1000,
          },
        ],
      },
    },
  });

  await prisma.purchaseTransaction.create({
    data: {
      externalId: 'EXT-PURCHASE-005',
      merchantId: 1,
      referenceId: 'REF-PURCHASE-005',
      providerName: 'LINKAJA',
      paymentMethodName: 'LINKAJA-WALLET',
      nominal: 500000,
      netNominal: 490000,
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 5000,
            isPercentage: false,
            fee: 5000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 1,
            type: 'AGENT',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
        ],
      },
    },
  });

  // === DISBURSEMENT TRANSACTIONS (5) ===
  await prisma.disbursementTransaction.create({
    data: {
      externalId: 'EXT-DISB-001',
      referenceId: 'BANK-REF-DISB-001',
      merchantId: 1,
      providerName: 'BCA',
      recipientName: 'Merchant One',
      recipientBank: 'BCA',
      recipientAccount: '1234567890',
      nominal: 500000,
      netNominal: 495000,
      status: 'SUCCESS',
      paymentMethod: 'TRANSFER_BANK',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
        ],
      },
    },
  });

  // tambahkan 4 transaksi disbursement lainnya dengan merchantId 1 & 2 bergantian
  // ...

  // === WITHDRAW TRANSACTIONS (5) ===
  await prisma.withdrawTransaction.create({
    data: {
      externalId: 'EXT-WD-001',
      merchantId: 1,
      referenceId: 'BANK-REF-WD-001',
      nominal: 300000,
      netNominal: 295000,
      providerName: 'BCA',
      paymentMethod: 'TRANSFER_BANK',
      status: 'SUCCESS',
      feeDetails: {
        create: [
          {
            agentId: 1,
            type: 'PROVIDER',
            nominal: 3000,
            isPercentage: false,
            fee: 3000,
          },
          {
            agentId: 1,
            type: 'INTERNAL',
            nominal: 2000,
            isPercentage: false,
            fee: 2000,
          },
        ],
      },
    },
  });

  // tambahkan 4 transaksi withdraw lainnya dengan agentId 1 & 2 bergantian
  // ...

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
