import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal } from 'src/decorator/decimal.decorator';

export class CreateTopupTransactionDto {
  // @ApiProperty({ example: 'trx-topup-123456789' })
  // @IsOptional()
  // @IsString()
  // externalId?: string;

  // @ApiProperty({ required: false, example: 'ref_abc123' })
  // @IsString()
  // @IsNotEmpty()
  // referenceId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  merchantId: number;

  // @ApiProperty({ example: 'INTERNAL' })
  // @IsString()
  // providerName: string;

  // @ApiProperty({ example: 'TRANSFER_BANK' })
  // @IsString()
  // paymentMethodName: string;

  /// TODO Multipart Form-Data using Multer Engine
  @ApiProperty({ example: 'www.google.com' })
  @IsString()
  @IsOptional()
  receiptImage: string | null;

  // @ApiProperty({ required: false, example: 3 })
  // @IsOptional()
  // @IsInt()
  // agentId?: number;

  @ApiProperty({
    type: Decimal,
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ToDecimal()
  nominal: Decimal;

  // @ApiProperty({
  //   description: 'Amount in decimal string format, e.g. "10000.00"',
  //   example: '10000.00',
  // })
  // @IsNumberString()
  // @ToDecimal()
  // @IsOptional()
  // netNominal: Decimal;

  // @ApiProperty({
  //   required: false,
  //   description: 'Net amount in decimal string format, e.g. "9700.00"',
  //   example: '9700.00',
  // })
  // @IsOptional()
  // @IsNumberString()
  // @ToDecimalNullable()
  // netAmount: Decimal | null;

  // @ApiProperty({
  //   required: false,
  //   example: {
  //     customerName: 'John Doe',
  //     orderItems: ['item1', 'item2'],
  //   },
  // })
  // @IsOptional()
  // metadata?: any;
}
