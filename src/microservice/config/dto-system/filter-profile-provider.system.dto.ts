import { ApiProperty } from '@nestjs/swagger';
import { TransactionTypeEnum } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { TransactionUserRole } from 'src/microservice/transaction.constant';

export class FilterProfileProviderSystemDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Type(() => Number)
  profileId: number;

  @ApiProperty({ enum: TransactionUserRole })
  @IsEnum(TransactionUserRole)
  userRole: TransactionUserRole;

  @ApiProperty({ enum: TransactionTypeEnum })
  @IsEnum(TransactionTypeEnum)
  transactionType: TransactionTypeEnum;
}
