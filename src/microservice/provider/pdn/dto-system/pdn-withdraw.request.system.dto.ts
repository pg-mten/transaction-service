import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator';

export class PdnWithdrawRequestSystemDto {
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
  bankCode: string;

  @IsString()
  @ApiProperty()
  bankName: string;

  @IsString()
  @ApiProperty()
  accountNumber: string;

  @IsString()
  @ApiProperty()
  paymentMethodName: string;
}
