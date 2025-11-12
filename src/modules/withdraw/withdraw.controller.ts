import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
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
import { UpdateWithdrawCallbackSystemDto } from 'src/microservice/transaction/withdraw/dto-system/update-withdraw-callback.system.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SERVICES } from 'src/microservice/client.constant';
import { ResponseInterceptor } from 'src/interceptor/response.interceptor';
import { CustomValidationPipe } from 'src/pipe/custom-validation.pipe';

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

  @Get(':id/detail')
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

  @Post('/internal/callback')
  @ApiTags('Internal')
  @ApiOperation({
    summary:
      'Pengubahan status berdasarkan external id dan code dari provider services',
  })
  @ApiBody({ type: UpdateWithdrawCallbackSystemDto })
  callback(@Body() body: UpdateWithdrawCallbackSystemDto) {
    return this.service.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.cmd.withdraw_callback })
  @UseInterceptors(ResponseInterceptor)
  async callbackTCP(
    @Payload(CustomValidationPipe) payload: UpdateWithdrawCallbackSystemDto,
  ) {
    return this.service.callback(payload);
  }
}
