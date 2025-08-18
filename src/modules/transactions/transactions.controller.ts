// src/transactions/transactions.controller.ts
import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';

import { TransactionsService } from './transactions.service';
import { CreatePurchaseTransactionDto } from './dto/create-purchase-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { TransactionPurchaseService } from './transaction-purchase.service';

@ApiTags('Transactions', 'Purchase')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionPurchaseService: TransactionPurchaseService,
  ) {}

  /**
   * Purchase
   */
  @Post('purchase')
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreatePurchaseTransactionDto })
  async create(@Body() body: CreatePurchaseTransactionDto) {
    await this.transactionPurchaseService.create(body);
    return new ResponseDto({ status: ResponseStatus.CREATED });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: string) {
    return await this.transactionPurchaseService.findOneThrow(id);
  }

  @Get('purchase')
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: PurchaseTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterTransactionDto,
  ) {
    console.log({ filter, pageable });
    return this.transactionPurchaseService.findAll(pageable, filter);
  }

  /// TODO: Transaction dan Settlement masih dijadikan satu
  // @Get('internal/settlement')
  // @ApiOperation({ summary: 'Settlement process hourly' })
  // async settlement(@Query() filter: FilterTransactionSettlementDto) {
  //   console.log({ filter });
  //   return this.transactionsService.internalTransactionSettlement(filter);
  // }

  @Post('webhook')
  async webhook(@Body() body: any) {
    const { external_id, status } = body;
    return this.transactionsService.handleWebhook(external_id, status, body);
  }
}
