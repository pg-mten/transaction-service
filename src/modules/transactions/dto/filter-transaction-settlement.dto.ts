import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export class FilterTransactionSettlementDto {
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @ApiProperty({ example: '2025-08-01 11:00:00' })
  from: Date;

  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @ApiProperty({ example: '2025-08-01 12:00:00' })
  to: Date;
}
