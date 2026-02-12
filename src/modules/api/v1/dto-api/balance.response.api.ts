import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/shared/decorator';
import { DtoHelper } from 'src/shared/helper';

export class BalanceResponseApi {
  constructor(data: BalanceResponseApi) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balancePending: Decimal;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: String })
  currency: string;
}
