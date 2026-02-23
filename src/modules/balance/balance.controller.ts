import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { FilterAggregateBalanceInternal } from './dto/filter-aggregate-balance-internal.dto';
import {
  BalanceAgentDto,
  BalanceDto,
  BalanceMerchantDto,
} from './dto/balance.dto';

@ApiTags('Balance')
@Controller('Balance')
export class BalanceController {
  constructor(private readonly service: BalanceService) {}

  @Get('merchant/:merchantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil Balance Merchant' })
  @ApiParam({ name: 'merchantId', description: 'ID Merchant' })
  @ApiOkResponse({ type: BalanceMerchantDto })
  async getMerchantBalance(
    @Param('merchantId', ParseIntPipe) merchantId: number,
  ) {
    return await this.service.checkBalanceMerchant(merchantId);
  }

  @Get('agent/:agentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil Balance Agent' })
  @ApiParam({ name: 'agentId', description: 'ID Agent' })
  @ApiOkResponse({ type: BalanceAgentDto })
  async getAgentBalance(@Param('agentId', ParseIntPipe) agentId: number) {
    console.log({ agentId });
    return await this.service.checkBalanceAgent(agentId);
  }

  @Get('/aggregate/internal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggregate Balance Internal' })
  @ApiOkResponse({ type: BalanceDto })
  async getInternalBalance(@Query() filter: FilterAggregateBalanceInternal) {
    console.log({ filter });
    return await this.service.aggregateBalanceInternal(filter.providerName);
  }

  @Get('/aggregate/merchant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggregate Balance All Merchant' })
  @ApiOkResponse({ type: BalanceDto })
  async getAllMerchantBalance() {
    return await this.service.aggregateBalanceMerchant();
  }

  @Get('/aggregate/agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggregate Balance All Agent' })
  @ApiOkResponse({ type: BalanceDto })
  async getAllAgentBalance() {
    return await this.service.aggregateBalanceAgent();
  }
}
