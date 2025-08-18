import { ApiProperty } from '@nestjs/swagger';
import { TopupPaymentMethodEnum } from '@prisma/client';
import { IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal, ToDecimalNullable } from 'src/decorator/decimal.decorator';

export class CreateDisbursementTransactionDto {
  @ApiProperty({ example: 'trx-topup-123456789' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ required: false, example: 'ref_abc123' })
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  merchantId: number;

  @ApiProperty({ example: 'PROVIDER' })
  @IsString()
  providerName: string;

  @ApiProperty({ example: 'adi saputro' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'BCA' })
  @IsString()
  recipientBank: string;

  @ApiProperty({ example: '634982364' })
  @IsString()
  recipientAccount: string;

  @ApiProperty({ example: 'TRANSFER_BANK' })
  @IsString()
  paymentMethodName: TopupPaymentMethodEnum;

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
  nominal: Decimal;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
  @ToDecimal()
  @IsOptional()
  netNominal: Decimal;

  @ApiProperty({
    required: false,
    description: 'Net amount in decimal string format, e.g. "9700.00"',
    example: '9700.00',
  })
  @IsOptional()
  @IsNumberString()
  @ToDecimalNullable()
  netAmount: Decimal | null;

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
