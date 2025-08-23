import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BalanceService } from './balance.service';

@ApiTags('Balance')
@Controller('Balance')
export class BalanceController {
  constructor(private readonly service: BalanceService) {}

  @Get('merchant/:id')
  @ApiOperation({ summary: 'Ambil Balance Merchant' })
  @ApiParam({ name: 'id', description: 'ID Merchant' })
  async getMerchantBalance(@Param('id') id: number) {
    return await this.service.checkBalanceMerchant(id);
  }

  @Get('agent/:id')
  @ApiOperation({ summary: 'Ambil Balance Agent' })
  @ApiParam({ name: 'id', description: 'ID Agent' })
  async getAgentBalance(@Param('id') id: number) {
    return await this.service.checkBalanceMerchant(id);
  }

  @Get('internal')
  @ApiOperation({ summary: 'Ambil Balance Internal' })
  @ApiParam({ name: 'providerName', description: 'ProviderName' })
  async getInternalBalance(@Param('providerName') providerName: string) {
    return await this.service.checkBalanceInternal(providerName);
  }

  @Get('all-merchant')
  @ApiOperation({ summary: 'Ambil Balance All Merchant' })
  async getAllMerchantBalance() {
    return await this.service.checkBalanceAllMerchant();
  }

  @Get('all-agent')
  @ApiOperation({ summary: 'Ambil Balance All Agent' })
  async getAllAgentBalance() {
    return await this.service.checkBalanceAllAgent();
  }
}
