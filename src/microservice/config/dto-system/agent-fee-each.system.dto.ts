import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class AgentFeeEachSystemDto {
  constructor(data: AgentFeeEachSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  id: number;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  feePercentage: Decimal;
}
