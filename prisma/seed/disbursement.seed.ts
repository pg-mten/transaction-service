import { INestApplicationContext } from '@nestjs/common';
import Decimal from 'decimal.js';
import { DisbursementService } from 'src/modules/disbursement/disbursement.service';
import { UuidHelper } from 'src/shared/helper/uuid.helper';

export async function disbursementSeed(app: INestApplicationContext) {
  try {
    // const disbursementService = app.get(DisbursementService);
    // await disbursementService.create({
    //   merchantId: 1,
    //   providerName: 'DANA',
    //   paymentMethodName: 'TRANSFERBANK',
    //   recipientAccount: '167885566789',
    //   recipientBank: 'MANDIRI',
    //   recipientName: '',
    //   referenceId: UuidHelper.v4(),
    //   nominal: new Decimal(100000),
    // });
    // await disbursementService.create({
    //   merchantId: 1,
    //   providerName: 'DANA',
    //   paymentMethodName: 'TRANSFEREWALLET',
    //   recipientAccount: '167885566789',
    //   recipientBank: 'MANDIRI',
    //   recipientName: '',
    //   referenceId: UuidHelper.v4(),
    //   nominal: new Decimal(200000),
    // });
    // await disbursementService.create({
    //   merchantId: 1,
    //   providerName: 'NETZME',
    //   paymentMethodName: 'TRANSFERBANK',
    //   recipientAccount: '167885566789',
    //   recipientBank: 'MANDIRI',
    //   recipientName: '',
    //   referenceId: UuidHelper.v4(),
    //   nominal: new Decimal(300000),
    // });
    // await disbursementService.create({
    //   merchantId: 1,
    //   providerName: 'NETZME',
    //   paymentMethodName: 'TRANSFEREWALLET',
    //   recipientAccount: '167885566789',
    //   recipientBank: 'MANDIRI',
    //   recipientName: '',
    //   referenceId: UuidHelper.v4(),
    //   nominal: new Decimal(400000),
    // });
  } catch (error) {
    console.log('Error');
    console.log(error);
  } finally {
    console.log('disbursementSeed Complete');
  }
}
