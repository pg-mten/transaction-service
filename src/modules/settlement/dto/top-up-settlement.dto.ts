import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { ToDecimalFixed } from 'src/decorator/decimal.decorator';
import { DtoHelper } from 'src/shared/helper/dto.helper';
import { FeeDetailDto } from './fee-detail.dto';

export class TopupSettlementDto {
  constructor(data: TopupSettlementDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: String })
  id: number;

  @ApiProperty({ type: Number })
  merchantId: number;

  @ApiProperty({ type: String })
  providerName: string;

  @ApiProperty({ type: String })
  paymentMethodName: string;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  nominal: Decimal;

  @ToDecimalFixed()
  @ApiProperty({ type: Decimal })
  netNominal: Decimal;

  @ApiProperty({ type: FeeDetailDto, isArray: true })
  feeDetails: FeeDetailDto[];
}
