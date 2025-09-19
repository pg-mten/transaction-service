import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterMerchantsAndAgentsByIdsSystemDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  merchantIds: string | null;

  @ApiProperty()
  @IsString()
  @IsOptional()
  agentIds: string | null;
}
