import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateMerchantSystemDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  id: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  agentId: number;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  settlementInterval: number | null;
}
