import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { FilterDisbursementDto } from './dto/filter-disbursement.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { DisbursementService } from './disbursement.service';
import { CreateDisbursementTransactionDto } from './dto/create-disbursement-transaction.dto';
import { DisbursementTransactionDto } from './dto/disbursement-transaction.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { CustomValidationPipe } from 'src/shared/pipe';
import { UpdateDisbursementCallbackSystemDto } from 'src/microservice/transaction/disbursement/dto-system/update-disbursement-callback.system.dto';
import { SystemApi } from 'src/microservice/auth/decorator';

@ApiTags('Transactions', 'Disbursement')
@Controller('transactions/disbursement')
export class DisbursementTransactionsController {
  constructor(private readonly service: DisbursementService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Disbursement baru' })
  @ApiBody({ type: CreateDisbursementTransactionDto })
  async create(@Body() body: CreateDisbursementTransactionDto) {
    const data = await this.service.create(body);
    return new ResponseDto({
      status: ResponseStatus.CREATED,
      data: data,
    });
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: number) {
    return await this.service.findOneThrow(id);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: DisbursementTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterDisbursementDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }

  @SystemApi()
  @Post('/internal/callback')
  @ApiTags('Internal')
  @ApiOperation({
    summary:
      'Pengubahan status berdasarkan external id dan code dari provider services',
  })
  @ApiBody({ type: UpdateDisbursementCallbackSystemDto })
  callback(@Body() body: UpdateDisbursementCallbackSystemDto) {
    return this.service.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.cmd.withdraw_callback })
  async callbackTCP(
    @Payload(CustomValidationPipe) payload: UpdateDisbursementCallbackSystemDto,
  ) {
    return this.service.callback(payload);
  }
}
