import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper';

export class BalanceResponseApi {
  constructor(data: BalanceResponseApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty()
  userId: number;

  @ApiProperty()
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty()
  @ToDecimalFixed()
  balancePending: Decimal;

  @ApiProperty()
  message: string;

  @ApiProperty()
  currency: string;
}
