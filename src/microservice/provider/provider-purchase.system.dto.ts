import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProviderPurchaseSystemDto {
  constructor(data: ProviderPurchaseSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  message: string;

  @ToDecimalFixed()
  @ApiProperty()
  nominal: Decimal;

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
