import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/decorator/date.decorator';
import { TransactionStatusEnum } from '@prisma/client';

export class FilterTransactionDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({ type: String, example: '2025-08-01', required: false })
  @IsOptional()
  @ToDateTimeNullable()
  from: DateTime;

  @ApiProperty({ type: String, example: '2025-08-02', required: false })
  @IsOptional()
  @ToDateTimeNullable()
  to: DateTime | null;

  @ApiProperty({ type: Number, example: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  merchantId: number | null;

  @ApiProperty({ type: String, example: 'NETZME', required: false })
  @IsOptional()
  provider: string | null;

  @ApiPropertyOptional({ enum: TransactionStatusEnum })
  @IsOptional()
  @IsEnum(TransactionStatusEnum)
  status: TransactionStatusEnum | null;
}
