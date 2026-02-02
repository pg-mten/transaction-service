import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/shared/decorator';
import { TransactionStatusEnum } from '@prisma/client';

export class FilterWithdrawDto {
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

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  from: DateTime;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  to: DateTime | null;

  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  merchantId: number | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  providerName: string | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  paymentMethodName: string;

  @ApiPropertyOptional({ enum: TransactionStatusEnum })
  @IsOptional()
  @IsEnum(TransactionStatusEnum)
  status: TransactionStatusEnum | null;
}
