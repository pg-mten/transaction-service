import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/decorator/date.decorator';

export class FilterSettlementDto {
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
