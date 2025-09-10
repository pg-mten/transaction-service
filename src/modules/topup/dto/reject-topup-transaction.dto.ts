import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class RejectTopupTransactionDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  topupId: number;
}
