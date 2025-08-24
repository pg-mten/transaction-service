// src/transactions/transactions.controller.ts
import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreatePurchaseTransactionDto } from './dto/create-purchase-transaction.dto';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { PurchaseService } from './purchase.service';

@ApiTags('Transactions', 'Purchase')
@Controller('transactions/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreatePurchaseTransactionDto })
  async create(@Body() body: CreatePurchaseTransactionDto) {
    console.log({ body });
    await this.purchaseService.create(body);
    return new ResponseDto({ status: ResponseStatus.CREATED });
  }

  @Get(':id/detail')
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: number) {
    console.log({ id });
    return await this.purchaseService.findOneThrow(id);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: PurchaseTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterPurchaseDto,
  ) {
    console.log({ filter, pageable });
    return this.purchaseService.findAll(pageable, filter);
  }

  /// TODO: Transaction dan Settlement masih dijadikan satu
  // @Get('internal/settlement')
  // @ApiOperation({ summary: 'Settlement process hourly' })
  // async settlement(@Query() filter: FilterTransactionSettlementDto) {
  //   console.log({ filter });
  //   return this.transactionsService.internalTransactionSettlement(filter);
  // }
  // @Post('webhook')
  // webhook(@Body() body: any) {
  //   const { external_id, status } = body;
  //   return this.purchaseService.handleWebhook(external_id, status, body);
  // }
}
