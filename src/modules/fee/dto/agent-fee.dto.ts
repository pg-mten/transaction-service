import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { AgentFeeEachDto } from './agent-fee-each.dto';

export class AgentFeeDto {
  constructor(data: AgentFeeDto) {
    DtoHelper.assign(this, data);
  }

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ApiProperty()
  isPercentage: boolean;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  fee: Decimal;

  @ApiProperty({ type: AgentFeeEachDto, isArray: true })
  agents: AgentFeeEachDto[];
}
