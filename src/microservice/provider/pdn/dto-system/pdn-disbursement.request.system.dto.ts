import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator/decimal.decorator';

export class PdnDisbursementRequestSystemDto {
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
  @IsOptional()
  recipientBankName: string | null;

  @IsString()
  @ApiProperty()
  recipientAccountNumber: string;

  @IsString()
  @ApiProperty()
  paymentMethodName: string;
}
