import { AgentFeeDto } from '../../fee/dto/agent-fee.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MerchantFeeDto } from '../../fee/dto/merchant-fee.dto';
import { ProviderFeeDto } from '../../fee/dto/provider-fee.dto';
import { InternalFeeDto } from '../../fee/dto/internal-fee.dto';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class FeeDto {
  constructor(data: FeeDto) {
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
