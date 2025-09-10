import { INestApplicationContext } from '@nestjs/common';
import Decimal from 'decimal.js';
import { WithdrawService } from 'src/modules/withdraw/withdraw.service';

export async function withdrawSeed(app: INestApplicationContext) {
  try {
    const withdrawService = app.get(WithdrawService);

    await withdrawService.create({
      merchantId: 1,
      nominal: new Decimal(100000),
    });

    await withdrawService.create({
      merchantId: 1,
      nominal: new Decimal(200000),
    });

    await withdrawService.create({
      merchantId: 2,
      nominal: new Decimal(300000),
    });

    await withdrawService.create({
      merchantId: 2,
      nominal: new Decimal(400000),
    });
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('withdrawSeed Complete');
  }
}
