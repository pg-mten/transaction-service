// src/transactions/transactions.controller.ts
import { Controller, Get, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { PurchaseService } from './purchase.service';

@ApiTags('Transactions', 'Purchase')
@Controller('transactions/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

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
}
