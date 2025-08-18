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
  merchantFee: MerchantFeeDto;

  @ApiProperty({ type: AgentFeeDto })
  agentFee: AgentFeeDto;

  @ApiProperty({ type: ProviderFeeDto })
  providerFee: ProviderFeeDto;

  @ApiProperty({ type: InternalFeeDto })
  internalFee: InternalFeeDto;
}
