import { INestApplicationContext } from '@nestjs/common';
import Decimal from 'decimal.js';
import { TopupService } from 'src/modules/topup/topup.service';

export async function topupSeed(app: INestApplicationContext) {
  try {
    const topupService = app.get(TopupService);
    await topupService.create({
      merchantId: 1,
      receiptImage: 'www.google.com',
      nominal: new Decimal(500000),
    });

    await topupService.create({
      merchantId: 1,
      receiptImage: 'www.google.com',
      nominal: new Decimal(60000000),
    });

    await topupService.create({
      merchantId: 2,
      receiptImage: 'www.google.com',
      nominal: new Decimal(60000000),
    });

    await topupService.create({
      merchantId: 2,
      receiptImage: 'www.google.com',
      nominal: new Decimal(70000000),
    });
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('topupSeed Complete');
  }
}
