import { ApiProperty } from '@nestjs/swagger';
import { FeeTypeEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';

export class CreateTopupFeeDetailDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number, required: false })
  agentId: number | null;

  @ApiProperty({ enum: FeeTypeEnum })
  type: FeeTypeEnum;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ApiProperty({ type: Boolean })
  isPercentage: boolean;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  fee: Decimal;
}
