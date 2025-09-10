// src/transactions/transactions.controller.ts
import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';

import { FilterTopupDto } from './dto/filter-topup.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { TopupService } from './topup.service';
import { CreateTopupTransactionDto } from './dto/create-topup-transaction.dto';
import { TopupTransactionDto } from './dto/topup-transaction.dto';

@ApiTags('Transactions', 'Topup')
@Controller('transactions/topup')
export class TopupTransactionsController {
  constructor(private readonly service: TopupService) {}

  @Post()
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreateTopupTransactionDto })
  async create(@Body() body: CreateTopupTransactionDto) {
    await this.service.create(body);
    return new ResponseDto({ status: ResponseStatus.CREATED });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: number) {
    return await this.service.findOneThrow(id);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: TopupTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterTopupDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }
}
