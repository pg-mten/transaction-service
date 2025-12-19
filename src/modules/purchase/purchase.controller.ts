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
import { CreatePurchaseTransactionDto } from './dto/create-purchase.request.dto';

@ApiTags('Transactions', 'Purchase')
@Controller('transactions/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // {
  //   "statusCode": 201,
  //   "status": "CREATED",
  //   "message": "Created",
  //   "data": {
  //     "code": "1766123489-4-PURCHASE-PDN-QRIS",
  //     "nominal": "10000.00",
  //     "content": "00020101021226670016COM.NOBUBANK.WWW01189360050300000902920214859141829037280303UBE51440014ID.CO.QRIS.WWW0215ID20243100479390303UBE5204801153033605405100005802ID5913Stifin Expert6013JAKARTA BARAT6105116106262011491251298694845062582636888_d050579e-a965-400703A010804POSP63041A32",
  //     "productCode": "QRIS",
  //     "paymentMethodName": "QRIS",
  //     "providerName": "PDN"
  //   }
  // }

  @Post()
  @ApiOperation({ summary: 'Buat transaksi pembelian baru' })
  @ApiBody({ type: CreatePurchaseTransactionDto })
  async create(@Body() body: CreatePurchaseTransactionDto) {
    console.log({ body });
    return new ResponseDto({
      status: ResponseStatus.CREATED,
      data: await this.purchaseService.create(body),
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
  async callback(@Body() body: CreatePurchaseCallbackSystemDto) {
    return this.purchaseService.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.cmd.purchase_callback })
  @UseInterceptors(ResponseInterceptor)
  async callbackTCP(
    @Payload(CustomValidationPipe) payload: CreatePurchaseCallbackSystemDto,
  ) {
    return this.purchaseService.callback(payload);
  }
}
