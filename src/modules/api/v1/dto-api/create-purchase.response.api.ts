import { ApiProperty } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper';

export class CreatePurchaseResponseQRApi {
  constructor(data: CreatePurchaseResponseQRApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  qrString: string;

  // @ApiProperty()
  // qrImageUrl: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-02-04T03:15:30.123Z',
  })
  @ToDateTime()
  expiresAt: DateTime;
}

export class CreatePurchaseResponseApi {
  constructor(data: CreatePurchaseResponseApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  transactionId: number;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ type: String })
  status: string; // REQUEST, SUCCESS, EXPIRED, FAILED

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: String })
  paymentMethod: string; // QRIS, VIRTUALACCOUNT, DIRRECTEWALLET, TRANSFERBANK, TRANSFEREWALLET

  @ApiProperty({ type: CreatePurchaseResponseQRApi })
  qr: CreatePurchaseResponseQRApi;
}
