import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { TransactionUserRole } from 'src/shared/constant/transaction.constant';

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

  @ApiProperty()
  @IsString()
  transactionType: string;
}
