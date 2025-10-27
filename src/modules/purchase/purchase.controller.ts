// src/transactions/transactions.controller.ts
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
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { Pagination } from 'src/shared/pagination/pagination.decorator';
import { Pageable } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { PurchaseService } from './purchase.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SERVICES } from 'src/microservice/client.constant';
import { ResponseInterceptor } from 'src/interceptor/response.interceptor';
import { CustomValidationPipe } from 'src/pipe/custom-validation.pipe';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase.request.dto';

@ApiTags('Transactions', 'Purchase')
@Controller('transactions/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreatePurchaseRequestDto })
  async create(@Body() body: CreatePurchaseRequestDto) {
    console.log({ body });
    return new ResponseDto({
      status: ResponseStatus.CREATED,
      data: await this.purchaseService.createPurchase(body),
    });
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

  @Post('/internal/callback')
  @ApiTags('Internal')
  @ApiOperation({ summary: 'untuk update status dari provider services' })
  @ApiBody({ type: CreatePurchaseCallbackSystemDto })
  async createCallbackProvider(@Body() body: CreatePurchaseCallbackSystemDto) {
    return this.purchaseService.createCallbackProvider(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.cmd.purchase_callback })
  @UseInterceptors(ResponseInterceptor)
  async createCallbackProviderTCP(
    @Payload(CustomValidationPipe) payload: CreatePurchaseCallbackSystemDto,
  ) {
    return this.purchaseService.createCallbackProvider(payload);
  }
}
