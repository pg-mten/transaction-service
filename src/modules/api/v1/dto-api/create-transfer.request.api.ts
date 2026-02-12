import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator';

export class CreateTransferRequestApi {
  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ToDecimal()
  amount: Decimal;

  @ApiProperty({ type: String })
  @IsString()
  orderId: string; // Unique order ID from merchant

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  description: string | null;

  @ApiProperty({ type: String })
  @IsString()
  bankCode: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  bankName: string | null;

  @ApiProperty({ type: String })
  @IsString()
  accountNumber: string;

  @ApiProperty({ type: String })
  @IsString()
  accountName: string;

  @ApiProperty({ type: String })
  @IsString()
  currency: string;
}
