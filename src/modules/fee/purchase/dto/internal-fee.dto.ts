import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class InternalFeeDto {
  constructor(data: InternalFeeDto) {
    DtoHelper.assign(this, data);
  }

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ApiProperty({ type: Boolean })
  isPercentage: boolean;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  fee: Decimal;
}
