import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProviderFeeDto {
  constructor(data: ProviderFeeDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  name: string;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ApiProperty({ type: Boolean })
  isPercentage: boolean;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  fee: Decimal;
}
