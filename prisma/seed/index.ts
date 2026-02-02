import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../../src/modules/app/app.module';
import { INestApplicationContext } from '@nestjs/common';
import { purchaseSeed } from './purchase.seed';
import { topupSeed } from './topup.seed';
import { withdrawSeed } from './withdraw.seed';
import { disbursementSeed } from './disbursement.seed';
import { TransactionHelper } from 'src/shared/helper/transaction.helper';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeder selesai 🚀');
  // const app: INestApplicationContext =
  //   await NestFactory.createApplicationContext(AppModule);

  try {
    // await purchaseSeed(app);
    // await topupSeed(app);
    // await withdrawSeed(app);
    // await disbursementSeed(app);

    const codePurchase = TransactionHelper.createCode({
      transactionType: 'PURCHASE',
      userId: 1,
      paymentMethodName: 'QRIS',
      providerName: 'INACASH',
    });

    await prisma.purchaseTransaction.create({
      data: {
        merchantId: 1,
        netNominal: 9000,
        nominal: 10000,
        paymentMethodName: 'QRIS',
        providerName: 'INACASH',
        code: codePurchase,
        externalId: 'Inacash-1-2-455',
        status: 'SUCCESS',
        feeDetails: {
          createMany: {
            data: [
              {
                type: 'MERCHANT',
                feeFixed: 500,
                nominal: 500,
                feePercentage: new Decimal(0),
              },
              {
                type: 'PROVIDER',
                feeFixed: 200,
                nominal: 200,
                feePercentage: new Decimal(0),
              },
              {
                type: 'INTERNAL',
                feeFixed: 100,
                feePercentage: new Decimal(0),
                nominal: 100,
              },
              {
                type: 'AGENT',
                agentId: 1,
                feeFixed: 200,
                feePercentage: new Decimal(0),
                nominal: 200,
              },
            ],
          },
        },
        MerchantBalanceLog: {
          create: {
            transactionType: 'PURCHASE',
            merchantId: 1,
            changeAmount: 10000,
            balanceActive: 0,
            balancePending: 0,
          },
        },
        InternalBalanceLog: {
          create: {
            transactionType: 'PURCHASE',
            merchantId: 1,
            changeAmount: 100,
            balanceActive: 0,
            balancePending: 0,
            paymentMethodName: 'QRIS',
            providerName: 'INACASH',
          },
        },
        AgentBalanceLog: {
          create: {
            transactionType: 'PURCHASE',
            agentId: 1,
            changeAmount: 200,
            balancePending: 0,
            balanceActive: 0,
          },
        },
      },
    });

    const codeTopup = TransactionHelper.createCode({
      transactionType: 'TOPUP',
      userId: 1,
      paymentMethodName: 'TRANSFERBANK',
      providerName: 'INTERNAL',
    });

    await prisma.topUpTransaction.create({
      data: {
        merchantId: 1,
        netNominal: 90000,
        nominal: 90000,
        paymentMethodName: 'TRANSFERBANK',
        providerName: 'INTERNAL',
        receiptImage: '',
        referenceId: 'Internal-!3431',
        code: codeTopup,
        externalId: 'External-12-455',
        status: 'SUCCESS',
        feeDetails: {
          createMany: {
            data: [
              {
                type: 'MERCHANT',
                feeFixed: 0,
                nominal: 0,
                feePercentage: new Decimal(0),
              },
              {
                type: 'PROVIDER',
                feeFixed: 0,
                nominal: 0,
                feePercentage: new Decimal(0),
              },
              {
                type: 'INTERNAL',
                feeFixed: 0,
                feePercentage: new Decimal(0),
                nominal: 0,
              },
              {
                type: 'AGENT',
                agentId: 1,
                feeFixed: 0,
                feePercentage: new Decimal(0),
                nominal: 0,
              },
            ],
          },
        },
        merchantBalanceLog: {
          create: {
            merchantId: 1,
            transactionType: 'TOPUP',
            balanceActive: 100000,
            balancePending: 0,
            changeAmount: 90000,
          },
        },
      },
    });
    console.log('Proccess Done');
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('App Close');
    // await app.close();
  }
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
