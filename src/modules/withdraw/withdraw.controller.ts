import { Controller, Get, Param, Post, Body, Query, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { FilterWithdrawDto } from './dto/filter-withdraw.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { CreateWithdrawTransactionDto } from './dto/create-withdraw-transaction.dto';
import { WithdrawTransactionDto } from './dto/withdraw-transaction.dto';
import { WithdrawService } from './withdraw.service';
import { UpdateWithdrawCallbackSystemDto } from 'src/microservice/transaction/withdraw/dto-system/update-withdraw-callback.system.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { CustomValidationPipe } from 'src/shared/pipe';
import { SystemApi } from 'src/microservice/auth/decorator';
import { Response } from 'express';

@ApiTags('Transactions', 'Withdraw')
@Controller()
export class WithdrawTransactionsController {
  constructor(private readonly service: WithdrawService) {}

  @Post('transactions/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat Withdraw baru' })
  @ApiBody({ type: CreateWithdrawTransactionDto })
  async create(@Body() body: CreateWithdrawTransactionDto) {
    console.log({ body });
    await this.service.create(body);
    return new ResponseDto({ status: ResponseStatus.CREATED });
  }

  @Get('transactions/withdraw/:id/detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: number) {
    return await this.service.findOneThrow(id);
  }

  @Get('transactions/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: WithdrawTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterWithdrawDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }

  @Get('transactions/withdraw/csv')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ambil semua transaksi dalam format CSV (default 7 hari terakhir)',
  })
  @ApiProduces('text/csv')
  async findAllCsv(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterWithdrawDto,
    @Res() response: Response,
  ) {
    const csv = await this.service.findAllCsv(pageable, filter);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="withdraw-transactions.csv"',
    );
    response.send(`\ufeff${csv}`);
  }

  @SystemApi()
  @Post(SERVICES.TRANSACTION.point.withdraw_callback.path)
  @ApiTags('Internal')
  @ApiOperation({
    summary:
      'Pengubahan status berdasarkan external id dan code dari provider services',
  })
  @ApiBody({ type: UpdateWithdrawCallbackSystemDto })
  callback(@Body() body: UpdateWithdrawCallbackSystemDto) {
    return this.service.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.point.withdraw_callback.cmd })
  async callbackTCP(
    @Payload(CustomValidationPipe) payload: UpdateWithdrawCallbackSystemDto,
  ) {
    return this.service.callback(payload);
  }
}
