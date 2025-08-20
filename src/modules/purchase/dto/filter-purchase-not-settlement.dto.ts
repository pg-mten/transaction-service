import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class FilterPurchaseNotSettlement {
  @ApiProperty({ type: Number, required: false })
  @Type(() => Number)
  @IsNumber()
  merchantId: number | null;
}
