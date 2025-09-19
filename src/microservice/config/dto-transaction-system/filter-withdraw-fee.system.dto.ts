import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/decorator/decimal.decorator';

export class FilterWithdrawFeeSystemDto {
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 1 })
  merchantId: number;

  @IsString()
  @ApiProperty({ example: 'NETZME' })
  providerName: string;

  @IsString()
  @ApiProperty({ example: 'QRIS' })
  paymentMethodName: string;

  @ToDecimal()
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ApiProperty({ type: Decimal, example: '100' })
  nominal: Decimal;
}
