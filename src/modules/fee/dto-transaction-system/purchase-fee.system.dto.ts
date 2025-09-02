import { AgentFeeSystemDto } from '../dto-system/agent-fee.system.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MerchantFeeSystemDto } from '../dto-system/merchant-fee.system.dto';
import { ProviderFeeSystemDto } from '../dto-system/provider-fee.system.dto';
import { InternalFeeSystemDto } from '../dto-system/internal-fee.system.dto';
import { DtoHelper } from 'src/shared/helper/dto.helper';

export class PurchaseFeeSystemDto {
  constructor(data: PurchaseFeeSystemDto) {
    DtoHelper.assign(this, data);
  }

  @ApiProperty({ type: MerchantFeeSystemDto })
  merchantFee: MerchantFeeSystemDto;

  @ApiProperty({ type: AgentFeeSystemDto })
  agentFee: AgentFeeSystemDto;

  @ApiProperty({ type: ProviderFeeSystemDto })
  providerFee: ProviderFeeSystemDto;

  @ApiProperty({ type: InternalFeeSystemDto })
  internalFee: InternalFeeSystemDto;
}
