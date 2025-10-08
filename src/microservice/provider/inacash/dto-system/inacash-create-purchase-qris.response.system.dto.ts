import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class InacashCreatePurchaseQrisResponseSystemDto {
  constructor(data: InacashCreatePurchaseQrisResponseSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  message: string;

  @ToDecimalFixed()
  @ApiProperty()
  amount: Decimal;

  @ApiProperty()
  content: string;

  @ApiProperty()
  externalId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  metadata: Record<string, unknown>;
}
