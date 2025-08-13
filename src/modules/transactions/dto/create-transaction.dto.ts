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

export class CreateTransactionDto {
  @ApiProperty({ example: 'trx_1234567890' })
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty({ required: false, example: 'ref_abc123' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  merchantId: number;

  @ApiProperty({ example: 'NETZME' })
  @IsString()
  provider: string;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @IsInt()
  agentId?: number;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
  @ToDecimal()
  amount: Decimal;

  @ApiProperty({
    required: false,
    description: 'Net amount in decimal string format, e.g. "9700.00"',
    example: '9700.00',
  })
  @IsOptional()
  @IsNumberString()
  @ToDecimalNullable()
  nettAmount: Decimal | null;

  @ApiProperty({ example: 'QRIS' })
  @IsString()
  paymentMethod: string;

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
