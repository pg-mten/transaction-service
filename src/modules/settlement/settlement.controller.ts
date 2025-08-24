import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { DateHelper } from 'src/shared/helper/date.helper';
import { FilterSettlementDto } from './dto/filter-settlement.dto';
import { FilterUnsettlementDto } from './dto/filter-unsettlement.dto';
import { PurchaseTransactionDto } from '../purchase/dto/purchase-transaction.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';

@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get('/settled')
  @ApiOperation({
    summary: 'List purchase not yet settlement because automatic failure',
  })
  @ApiOkResponse({ type: PurchaseTransactionDto, isArray: true })
  async findAllSettlement(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterSettlementDto,
  ) {
    console.log({ pageable, filter });
    return this.settlementService.findAllSettlement(pageable, filter);
  }

  @Get('/unsettled')
  @ApiOperation({
    summary: 'List purchase not yet settlement because automatic failure',
  })
  @ApiOkResponse({ type: PurchaseTransactionDto, isArray: true })
  async findAllUnsettlement(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterUnsettlementDto,
  ) {
    console.log({ pageable, filter });
    return this.settlementService.findAllUnsettlement(pageable, filter);
  }

  @Post('/internal')
  @ApiTags('Internal')
  @ApiOperation({ summary: 'Internal Settlement hit by Config Service' })
  internalSettlement(@Body() body: UpdateSettlementInternalDto) {
    console.log('ids');
    console.log(body.merchantIds);
    return this.settlementService.internalSettlement(body);
  }

  @MessagePattern({ cmd: 'settlement_schedule' })
  internalSettlementTCP(filter: UpdateSettlementInternalDto) {
    filter.date = DateHelper.fromISO(filter.date.toString());
    return this.settlementService.internalSettlement(filter);
  }
}
