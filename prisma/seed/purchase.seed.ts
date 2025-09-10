import { INestApplicationContext } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PurchaseService } from 'src/modules/purchase/purchase.service';
import { UuidHelper } from 'src/shared/helper/uuid.helper';

export async function purchaseSeed(app: INestApplicationContext) {
  try {
    const purchaseService = app.get(PurchaseService);

    await purchaseService.create({
      merchantId: 1,
      nominal: new Decimal(1000000), // 1 jt
      providerName: 'NETZME',
      paymentMethodName: 'QRIS',
      referenceId: UuidHelper.v4(),
    });

    await purchaseService.create({
      merchantId: 1,
      nominal: new Decimal(3500000), // 3.5 jt
      providerName: 'NETZME',
      paymentMethodName: 'VIRTUALACCOUNT',
      referenceId: UuidHelper.v4(),
    });

    await purchaseService.create({
      merchantId: 1,
      nominal: new Decimal(70000000), // 70 jt
      providerName: 'DANA',
      paymentMethodName: 'DIRECTEWALLET',
      referenceId: UuidHelper.v4(),
    });

    await purchaseService.create({
      merchantId: 1,
      nominal: new Decimal(10000000), // 10 jt
      providerName: 'DANA',
      paymentMethodName: 'VIRTUALACCOUNT',
      referenceId: UuidHelper.v4(),
    });
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('purchaseSeed Complete');
  }
  // await prisma.$transaction([
  //   prisma.purchaseTransaction.create({
  //     data: {
  //       referenceId: 'REF-PURCHASE-001',
  //       externalId: 'EXT-PURCHASE-001',
  //       merchantId: 1,
  //       providerName: 'NETZME',
  //       paymentMethodName: 'QRIS',
  //       nominal: new Decimal(1000000),
  //       netNominal: new Decimal(980000),
  //       status: 'SUCCESS',
  //       feeDetails: {
  //         create: [
  //           {
  //             type: 'PROVIDER',
  //             nominal: new Decimal(10000),
  //             feeFixed: new Decimal(10000),
  //             feePercentage: new Decimal(0),
  //           },
  //           {
  //             type: 'INTERNAL',
  //             nominal: new Decimal(10000),
  //             feeFixed: new Decimal(10000),
  //             feePercentage: new Decimal(0),
  //           },
  //         ],
  //       },
  //     },
  //   }),
  // ]);
}
