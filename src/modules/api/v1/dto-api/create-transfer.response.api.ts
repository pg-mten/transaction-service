import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper';

export class CreateTransferResponseApi {
  constructor(data: CreateTransferResponseApi) {
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
  status: string; // REQUEST, SUCCESS, EXPIRED, FAILED

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: String })
  currency: string;

  @ApiProperty({ type: String })
  bankCode: string;

  @ApiProperty({ type: String })
  bankName: string | null;

  @ApiProperty({ type: String })
  accountNumber: string;

  @ApiProperty({ type: String })
  accountName: string;

  @ApiProperty({ type: String })
  createdAt: string;
}
