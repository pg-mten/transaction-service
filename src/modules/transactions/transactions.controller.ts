// src/transactions/transactions.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { ApiResponseDto } from '../common/dto/response.dto';

@ApiTags('Transactions')
@ApiExtraModels(ApiResponseDto, TransactionResponseDto)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiResponse({
    status: 201,
    description: 'Transaksi berhasil dibuat',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  async create(@Body() dto: CreateTransactionDto) {
    const trx = await this.transactionsService.create(dto);
    return {
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: trx,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  @ApiResponse({
    status: 200,
    description: 'Detail transaksi ditemukan',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TransactionResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Transaksi tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    const trx = await this.transactionsService.findOne(id);
    if (!trx) throw new NotFoundException('Transaksi tidak ditemukan');

    return {
      success: true,
      message: 'Detail transaksi ditemukan',
      data: trx,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiResponse({
    status: 200,
    description: 'List transaksi ditemukan',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(TransactionResponseDto) },
                },
                total: { type: 'number', example: 42 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 5 },
              },
            },
          },
        },
      ],
    },
  })
  async findAll(@Query() filter: FilterTransactionDto) {
    return this.transactionsService.findAll(filter);
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
