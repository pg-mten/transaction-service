import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal } from 'src/decorator/decimal.decorator';

export class CreateWithdrawTransactionDto {
  // @ApiProperty({ example: 'trx-withdraw-123456789' })
  // @IsOptional()
  // @IsString()
  // externalId?: string;

  // @ApiProperty({ required: false, example: 'ref_abc123' })
  // @IsString()
  // @IsNotEmpty()
  // referenceId: string;

  // @ApiProperty({ example: 1 })
  // @IsInt()
  // merchantId: number;

  // @ApiProperty({ example: 'INTERNAL' })
  // @IsString()
  // providerName: string;

  // @ApiProperty({ example: 'TRANSFER_BANK' })
  // @IsString()
  // paymentMethodName: string;

  // @ApiProperty({ required: false, example: 3 })
  // @IsOptional()
  // @IsInt()
  // agentId?: number;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
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
  //   example: {
  //     customerName: 'John Doe',
  //     orderItems: ['item1', 'item2'],
  //   },
  // })
  // @IsOptional()
  // metadata?: any;
}
