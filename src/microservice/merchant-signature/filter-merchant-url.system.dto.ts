import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class FilterMerchantUrlSystemDto {
  @ApiProperty()
  @IsNumber()
  userId: number;
}
