import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { MerchantSystemDto } from './merchant.system.dto';
import { AgentSystemDto } from './agent.system.dto';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class MerchantsAndAgentsByIdsSystemDto {
  constructor(data: MerchantsAndAgentsByIdsSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  @IsOptional()
  merchants: MerchantSystemDto[];

  @ApiProperty()
  @IsOptional()
  agents: AgentSystemDto[];
}
