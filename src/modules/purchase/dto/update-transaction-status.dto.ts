import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatusEnum } from '@prisma/client';
import { IsString } from 'class-validator';

export class UpdateStatusPurchaseTransactionDto {
  @ApiProperty({ required: false, example: 'ref_abc123' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'SUCCESS' })
  @IsString()
  status: TransactionStatusEnum;

  @ApiProperty({ type: Object })
  metadata: object;

  @IsString()
  external_id: string;
}
