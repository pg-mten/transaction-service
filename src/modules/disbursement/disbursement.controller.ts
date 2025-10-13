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

@ApiTags('Transactions', 'Disbursement')
@Controller('transactions/disbursement')
export class DisbursementTransactionsController {
  constructor(private readonly service: DisbursementService) {}

  @Post()
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreateDisbursementTransactionDto })
  async create(@Body() body: CreateDisbursementTransactionDto) {
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
  @ApiOkResponse({ type: DisbursementTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterDisbursementDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }
}
