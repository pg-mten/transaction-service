import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatusEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import {
  ToDateTimeJsDate,
  ToDateTimeJsDateNullable,
} from 'src/decorator/date.decorator';
import { PurchaseFeeDetailDto } from './purchase-fee-detail.dto';

export class PurchaseTransactionDto {
  constructor(data: PurchaseTransactionDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  externalId: string | null;

  @ApiProperty({ type: String, required: false })
  referenceId: string | null;

  @ApiProperty({ type: Number })
  merchantId: number;

  @ApiProperty({ type: String })
  providerName: string;

  @ApiProperty({ type: String })
  paymentMethodName: string;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  netNominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  totalFeeCut: Decimal;

  @ApiProperty({ enum: TransactionStatusEnum })
  status: TransactionStatusEnum;

  @ApiProperty({ type: Object })
  metadata: object | null;

  @ApiProperty({ type: DateTime })
  @ToDateTimeJsDateNullable()
  settlementAt: DateTime | null;

  @ApiProperty({ type: DateTime })
  @ToDateTimeJsDateNullable()
  reconciliationAt: DateTime | null;

  @ApiProperty({ type: DateTime })
  @ToDateTimeJsDate()
  createdAt: DateTime;

  @ApiProperty({ type: PurchaseFeeDetailDto, isArray: true })
  feeDetails: PurchaseFeeDetailDto[];
}
