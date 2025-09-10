import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ApproveTopupTransactionDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  topupId: number;
}
