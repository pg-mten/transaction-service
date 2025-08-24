import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal, ToDecimalNullable } from 'src/decorator/decimal.decorator';

export class CreatePurchaseTransactionDto {
  @ApiProperty({ example: 'trx_1234567890' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  externalId?: string;

  @ApiProperty({ required: false, example: 'ref_abc123' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  merchantId: number;

  @ApiProperty({ example: 'NETZME' })
  @IsString()
  providerName: string;

  @ApiProperty({ example: 'QRIS' })
  @IsString()
  paymentMethodName: string;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
  @ToDecimal()
  nominal: Decimal;

  @ApiProperty({
    required: false,
    example: {
      customerName: 'John Doe',
      orderItems: ['item1', 'item2'],
    },
  })
  @IsOptional()
  metadata?: any;
}
