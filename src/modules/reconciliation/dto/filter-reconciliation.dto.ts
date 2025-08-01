import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class FilterReconciliationDto {
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @ApiProperty({ example: '2025-08-02 11:00:00' })
  from: Date;

  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  @IsDate()
  @ApiProperty({ example: '2025-08-03 12:00:00' })
  to: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'NETZME' })
  provider?: string;
}
