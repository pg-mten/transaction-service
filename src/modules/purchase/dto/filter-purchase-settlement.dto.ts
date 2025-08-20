import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/decorator/date.decorator';

export class FilterPurchaseSettlement {
  @ApiProperty({ type: Number })
  merchantId: number;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  from: DateTime | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  to: DateTime | null;
}
