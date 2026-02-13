import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { FilterDisbursementDto } from './dto/filter-disbursement.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { DisbursementService } from './disbursement.service';
import { DisbursementTransactionDto } from './dto/disbursement-transaction.dto';

@ApiTags('Transactions', 'Disbursement')
@Controller('transactions/disbursement')
export class DisbursementTransactionsController {
  constructor(private readonly service: DisbursementService) {}

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
}
