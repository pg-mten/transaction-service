import { AgentFeeDto } from './agent-fee.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MerchantFeeDto } from './merchant-fee.dto';
import { ProviderFeeDto } from './provider-fee.dto';
import { InternalFeeDto } from './internal-fee.dto';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class PurchasingFeeDto {
  constructor(data: PurchasingFeeDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: MerchantFeeDto })
  merchant: MerchantFeeDto;

  @ApiProperty({ type: AgentFeeDto })
  agent: AgentFeeDto;

  @ApiProperty({ type: ProviderFeeDto })
  provider: ProviderFeeDto;

  @ApiProperty({ type: InternalFeeDto })
  internal: InternalFeeDto;
}
