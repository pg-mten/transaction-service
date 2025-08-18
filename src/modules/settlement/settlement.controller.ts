import { Body, Controller, Patch } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Patch('/internal')
  @ApiOperation({ summary: 'Internal Settlement hit by Config Service' })
  internalSettlement(@Body() body: UpdateSettlementInternalDto) {
    console.log({ body });
    return this.settlementService.internalSettlement(body);
  }
}
