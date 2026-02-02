import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class ProviderWithdrawSystemDto {
  constructor(data: ProviderWithdrawSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;

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
  accountNumber: string;

  @ApiProperty()
  accountHolderName: string;

  @ApiProperty()
  metadata: Record<string, unknown>;
}
