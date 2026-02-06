import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator';

export class CreatePurchaseRequestApi {
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
  description: string;

  @ApiProperty({ type: String })
  @IsString()
  paymentMethod: string; // QRIS, VIRTUALACCOUNT, DIRRECTEWALLET, TRANSFERBANK, TRANSFEREWALLET

  @ApiProperty({ type: String })
  @IsString()
  currency: string;

  @ApiProperty({ type: Number, required: false })
  @IsInt()
  @IsOptional()
  expireSecond: number | null;
}
