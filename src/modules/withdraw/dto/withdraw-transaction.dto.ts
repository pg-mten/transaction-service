import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatusEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  ToDateTimeJsDate,
  ToDateTimeJsDateNullable,
  ToDecimalFixed,
} from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { WithdrawFeeDetailDto } from './withdraw-fee-detail.dto';
import { DateTime } from 'luxon';

export class WithdrawTransactionDto {
  constructor(data: WithdrawTransactionDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String, required: false })
  externalId: string | null;

  @ApiProperty({ type: String, required: false })
  referenceId: string | null;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: String })
  userRole: string;

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

  @ApiProperty({ type: Object, required: false })
  metadata: object | null;

  @ApiProperty({ type: DateTime, required: false })
  @ToDateTimeJsDateNullable()
  reconciliationAt: DateTime | null;

  @ApiProperty({ type: DateTime, required: false })
  @ToDateTimeJsDateNullable()
  paidAt: DateTime | null;

  @ApiProperty({ type: DateTime })
  @ToDateTimeJsDate()
  createdAt: DateTime;

  @ApiProperty({ type: WithdrawFeeDetailDto, isArray: true })
  feeDetails: WithdrawFeeDetailDto[];
}
