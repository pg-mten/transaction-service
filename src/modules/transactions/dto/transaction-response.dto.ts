// src/transactions/dto/transaction-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TransactionDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  amount: number;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  providerId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [TransactionDetailResponseDto] })
  transactionDetails: TransactionDetailResponseDto[];
}
