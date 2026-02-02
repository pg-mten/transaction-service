import { ApiProperty } from '@nestjs/swagger';
import { FeeTypeEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class TopupFeeDetailDto {
  constructor(data: TopupFeeDetailDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, required: false })
  agentId: number | null;

  @ApiProperty({ enum: FeeTypeEnum })
  type: FeeTypeEnum;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  feeFixed: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  feePercentage: Decimal;
}
