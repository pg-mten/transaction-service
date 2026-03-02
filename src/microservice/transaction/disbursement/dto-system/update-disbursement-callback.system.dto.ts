import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { DateTime } from 'luxon';
import { ToDateTime } from 'src/shared/decorator';
import { ToDecimal } from 'src/shared/decorator/decimal.decorator';

export class UpdateDisbursementCallbackSystemDto {
  @IsString()
  @ApiProperty()
  externalId: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty()
  status: string;

  @ApiProperty({ nullable: true })
  @ToDateTime()
  paidAt: DateTime | null;

  @ToDecimal()
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ApiProperty()
  nominal: Decimal;

  @IsObject()
  @IsOptional()
  @ApiProperty()
  metadata: Record<string, unknown> | null;
}
