import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class InternalFeeSystemDto {
  constructor(data: InternalFeeSystemDto) {
    DtoHelper.assign(this, data);
  }

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
