import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { FilterWithdrawDto } from './dto/filter-withdraw.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { CreateWithdrawTransactionDto } from './dto/create-withdraw-transaction.dto';
import { WithdrawTransactionDto } from './dto/withdraw-transaction.dto';
import { WithdrawService } from './withdraw.service';

@ApiTags('Transactions', 'Withdraw')
@Controller('transactions/withdraw')
export class WithdrawTransactionsController {
  constructor(private readonly service: WithdrawService) {}

  @Post()
  @ApiOperation({ summary: 'Buat Withdraw baru' })
  @ApiBody({ type: CreateWithdrawTransactionDto })
  async create(@Body() body: CreateWithdrawTransactionDto) {
    console.log({ body });
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
  @ApiOkResponse({ type: WithdrawTransactionDto, isArray: true })
  async findAll(
    @Pagination() pageable: Pageable,
    @Query() filter: FilterWithdrawDto,
  ) {
    console.log({ filter, pageable });
    return this.service.findAll(pageable, filter);
  }
}
