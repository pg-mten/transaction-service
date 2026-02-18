import { DtoHelper } from 'src/shared/helper';
import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';

export class ReadTransferDateResponseApi {
  constructor(data: ReadTransferDateResponseApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  transactionId: number;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  amount: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  netAmount: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  fee: Decimal;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: String, required: false })
  paidAt: string | null;

  @ApiProperty({ type: String })
  paymentMethod: string; // QRIS, VIRTUALACCOUNT, DIRRECTEWALLET, TRANSFERBANK, TRANSFEREWALLET
}
