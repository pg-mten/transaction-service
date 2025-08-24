import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ReconciliationCalculateDto {
  constructor(data: ReconciliationCalculateDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  count: number;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  nominal: Decimal;
}
