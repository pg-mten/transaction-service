import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class BalanceDto {
  constructor(data: BalanceDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balancePending: Decimal;
}

export class BalanceMerchantDto {
  constructor(data: BalanceMerchantDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balancePending: Decimal;

  @ApiProperty({ type: Number })
  merchantId: number;
}

export class BalanceAgentDto {
  constructor(data: BalanceAgentDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balancePending: Decimal;

  @ApiProperty({ type: Number })
  agentId: number;
}

export class BalanceInternalDto {
  constructor(data: BalanceInternalDto) {
    DtoHelper.assign(this, data);
  }
  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balanceActive: Decimal;

  @ApiProperty({ type: Decimal })
  @ToDecimalFixed()
  balancePending: Decimal;
}
