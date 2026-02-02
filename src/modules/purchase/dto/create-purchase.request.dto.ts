import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, ValidateIf } from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal } from 'src/decorator/decimal.decorator';

export class CreatePurchaseTransactionDto {
  // @ApiProperty({ example: 'trx_1234567890' })
  // @IsString()
  // @IsNotEmpty()
  // @IsOptional()
  // externalId?: string;

  // @ApiProperty({ required: false, example: 'ref_abc123' })
  // @IsOptional()
  // @IsString()
  // referenceId?: string;

  // @ApiProperty({ example: 'sfeerdegersd' })
  // @IsString()
  // @IsOptional()
  // code: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  merchantId: number;

  // @ApiProperty({ example: 'PDN' })
  // @IsString()
  // providerName: string;

  // @ApiProperty({ example: 'QRIS' })
  // @IsString()
  // paymentMethodName: string;

  // @ApiProperty({ example: 'PENDING', default: 'PENDING' })
  // @IsEnum(TransactionStatusEnum)
  // @IsOptional()
  // status: TransactionStatusEnum;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @Type(() => Decimal)
  @ValidateIf((o) => o.nominal !== undefined)
  @ToDecimal()
  nominal: Decimal;

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
