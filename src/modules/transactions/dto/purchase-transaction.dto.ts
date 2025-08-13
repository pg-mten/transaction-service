import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatusEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { PurchaseFeeDetailDto } from './purchase-fee-detail.dto';

export class PurchaseTransactionDto {
  constructor(data: PurchaseTransactionDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  externalId: string;

  @ApiProperty({ type: String, required: false })
  referenceId: string | null;

  @ApiProperty({ type: Number })
  merchantId: number;

  @ApiProperty({ type: String })
  provider: string;

  @ApiProperty({ type: String, required: false })
  agentId: number | null;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  amount: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  netAmount: Decimal | null;

  @ApiProperty({ type: String })
  status: TransactionStatusEnum;

  @ApiProperty({ type: String })
  paymentMethod: string;

  @ApiProperty({ type: Object })
  metadata: object;

  @ApiProperty({ type: DateTime })
  settlementAt: DateTime | null;

  @ApiProperty({ type: DateTime })
  reconciliationAt: DateTime | null;

  @ApiProperty({ type: PurchaseFeeDetailDto, isArray: true })
  feeDetails: PurchaseFeeDetailDto[];
}
