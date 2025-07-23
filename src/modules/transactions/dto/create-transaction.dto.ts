import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: 'trx_1234567890' })
  @IsString()
  @IsNotEmpty()
  external_id: string;

  @ApiProperty({ required: false, example: 'ref_abc123' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  merchant_id: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  provider_id: number;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @IsInt()
  agent_id?: number;

  @ApiProperty({
    description: 'Amount in decimal string format, e.g. "10000.00"',
    example: '10000.00',
  })
  @IsNumberString()
  amount: string;

  @ApiProperty({
    required: false,
    description: 'Net amount in decimal string format, e.g. "9700.00"',
    example: '9700.00',
  })
  @IsOptional()
  @IsNumberString()
  nettAmount?: string;

  @ApiProperty({ example: 'VA_BCA' })
  @IsString()
  method: string;

  @ApiProperty({
    required: false,
    example: {
      customer_name: 'John Doe',
      order_items: ['item1', 'item2'],
    },
  })
  @IsOptional()
  metadata?: any;
}
