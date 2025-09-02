import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatusEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { DisbursementFeeDetailDto } from './disbursement-fee-detail.dto';

export class DisbursementTransactionDto {
  constructor(data: DisbursementTransactionDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: String })
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

  @ApiProperty({ enum: TransactionStatusEnum })
  status: TransactionStatusEnum;

  @ApiProperty({ type: Object })
  metadata: object | null;

  @ApiProperty({ type: DisbursementFeeDetailDto, isArray: true })
  feeDetails: DisbursementFeeDetailDto[];
}
