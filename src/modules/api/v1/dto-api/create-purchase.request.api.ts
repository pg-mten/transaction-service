import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import Decimal from 'decimal.js';
import { ToDecimal } from 'src/shared/decorator';
import { PaymentMethodName } from 'src/shared/constant/transaction.constant';

export class CreatePurchaseRequestApi {
  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @Type(() => Decimal)
  @IsDefined()
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
  @IsIn(Object.values(PaymentMethodName))
  paymentMethod: string; // QRIS, VIRTUALACCOUNT, DIRRECTEWALLET, TRANSFERBANK, TRANSFEREWALLET

  @ApiProperty({ type: String })
  @IsString()
  @IsIn(['IDR'])
  currency: string;

  @ApiProperty({ type: Number, required: false })
  @IsInt()
  @IsOptional()
  @Min(60)
  @Max(86400)
  expireSecond: number | null;
}
