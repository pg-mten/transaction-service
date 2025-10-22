import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProviderDisbursementSystemDto {
  constructor(data: ProviderDisbursementSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ToDecimalFixed()
  @ApiProperty()
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty()
  feeProviderRealized: Decimal;

  @ToDecimalFixed()
  @ApiProperty()
  netNominal: Decimal;

  @ApiProperty()
  externalId: string;

  @ApiProperty()
  recipientAccountNumber: string;

  @ApiProperty()
  recepientAccountHolderName: string;

  @ApiProperty()
  metadata: Record<string, unknown>;
}
