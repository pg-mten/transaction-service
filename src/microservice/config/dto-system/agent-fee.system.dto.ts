import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { AgentFeeEachSystemDto } from './agent-fee-each.system.dto';

export class AgentFeeSystemDto {
  constructor(data: AgentFeeSystemDto) {
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

  @ApiProperty({ type: AgentFeeEachSystemDto, isArray: true })
  agents: AgentFeeEachSystemDto[];
}
