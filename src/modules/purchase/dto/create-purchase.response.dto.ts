import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class CreatePurchaseResponseDto {
  constructor(data: CreatePurchaseResponseDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  code: string;

  @ToDecimalFixed()
  @ApiProperty()
  nominal: Decimal;

  @ApiProperty()
  content: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  paymentMethodName: string;

  @ApiProperty()
  providerName: string;
}
