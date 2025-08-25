import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterAggregateBalanceInternal {
  @ApiProperty({ type: String, required: false })
  @IsString()
  @IsOptional()
  providerName: string | null;
}
