import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import {
  TransactionTypeEnum,
  TransactionUserRole,
} from 'src/shared/constant/transaction.constant';

export class FilterProfileProviderSystemDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ enum: TransactionUserRole })
  @IsEnum(TransactionUserRole)
  userRole: TransactionUserRole;

  @ApiProperty({
    enum: Object.values(TransactionTypeEnum),
    // example: TransactionTypeEnum.PURCHASE,
  })
  @IsEnum(TransactionTypeEnum)
  transactionType: string;
}
