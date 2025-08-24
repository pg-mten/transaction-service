import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/decorator/date.decorator';

export class FilterSettlementDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  size: number;

  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  merchantId: number | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  from: DateTime | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  to: DateTime | null;
}
