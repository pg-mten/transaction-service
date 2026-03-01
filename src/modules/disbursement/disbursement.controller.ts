import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBearerAuth,
  ApiProduces,
} from '@nestjs/swagger';
import { FilterDisbursementDto } from './dto/filter-disbursement.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { DisbursementService } from './disbursement.service';
import { DisbursementTransactionDto } from './dto/disbursement-transaction.dto';
import { Response } from 'express';

@ApiTags('Transactions', 'Disbursement')
@Controller('transactions/disbursement')
export class DisbursementTransactionsController {
  constructor(private readonly service: DisbursementService) {}

  @Get(':id/detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID transaksi' })
  async findOne(@Param('id') id: number) {
    return await this.service.findOneThrow(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil semua transaksi (default 7 hari terakhir)' })
  @ApiOkResponse({ type: DisbursementTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterDisbursementDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }

  @Get('csv')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ambil semua transaksi dalam format CSV (default 7 hari terakhir)',
  })
  @ApiProduces('text/csv')
  async findAllCsv(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterDisbursementDto,
    @Res() response: Response,
  ) {
    const csv = await this.service.findAllCsv(pageable, filter);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="disbursement-transactions.csv"',
    );
    response.send(`\ufeff${csv}`);
  }
}
