import { Body, Controller, Post } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ApiOperation } from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';

@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('/internal')
  @ApiOperation({ summary: 'Internal Settlement hit by Config Service' })
  internalSettlement(@Body() body: UpdateSettlementInternalDto) {
    console.log('ids');
    console.log(body.merchantIds);
    return this.settlementService.internalSettlement(body);
  }

  @MessagePattern({ cmd: 'settlement_schedule' })
  internalSettlementTCP(filter: UpdateSettlementInternalDto) {
    console.log({ filter });
    return this.settlementService.internalSettlement(filter);
  }
}
