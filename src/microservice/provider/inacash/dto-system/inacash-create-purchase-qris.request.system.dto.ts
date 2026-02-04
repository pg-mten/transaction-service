import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator/decimal.decorator';

export class InacashCreatePurchaseQrisRequestSystemDto {
  @ToDecimal()
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ApiProperty()
  nominal: Decimal;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty()
  merchantId: number;

  @IsString()
  @ApiProperty()
  code: string;
}
