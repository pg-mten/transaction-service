import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator/decimal.decorator';

export class InacashDisbursementRequestSystemDto {
  @IsString()
  @ApiProperty()
  code: string;

  @ToDecimal()
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ApiProperty()
  nominal: Decimal;

  @IsString()
  @ApiProperty()
  recipientBankCode: string;

  @IsString()
  @ApiProperty()
  recipientBankName: string;

  @IsString()
  @ApiProperty()
  recipientAccountNumber: string;

  @IsString()
  @ApiProperty()
  paymentMethodName: string;
}
