import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumberString, IsString } from 'class-validator';
import { Decimal } from 'decimal.js';
import { ToDecimal } from 'src/decorator/decimal.decorator';

export class CreateDisbursementTransactionDto {
  // @ApiProperty({ example: 'trx-topup-123456789' })
  // @IsOptional()
  // @IsString()
  // externalId: string | null;

  // @ApiProperty({ required: false, example: 'ref_abc123' })
  // @IsOptional()
  // @IsString()
  // referenceId: string | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  merchantId: number;

  // @ApiProperty({ example: 'PROVIDER' })
  // @IsString()
  // providerName: string;

  @ApiProperty({ example: 'adi saputro' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: '014' })
  @IsString()
  recipientBankCode: string;

  @ApiProperty({ example: 'BCA' })
  @IsString()
  recipientBankName: string;

  @ApiProperty({ example: '634982364' })
  @IsString()
  recipientAccountNumber: string;

  // @ApiProperty({ example: 'TRANSFER_BANK' })
  // @IsString()
  // paymentMethodName: string;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
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
