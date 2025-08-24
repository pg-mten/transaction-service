import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { DateTime } from 'luxon';
import { ToDateTimeNullable } from 'src/decorator/date.decorator';

export class FilterReconciliationCalculateDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  from: DateTime | null;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @ToDateTimeNullable()
  to: DateTime | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false, example: 'NETZME' })
  providerName: string | null;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false, example: 'QRIS' })
  paymentMethodName: string | null;
}
