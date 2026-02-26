import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MerchantSignatureHeader,
  MerchantSignatureHeaderDto,
} from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { MerchantApi, SystemApi } from 'src/microservice/auth/decorator';
import { CreatePurchaseRequestApi } from './dto-api/create-purchase.request.api';
import { Purchase1Api } from './purchase.1.api';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { SERVICES } from 'src/shared/constant/client.constant';
import { SkipReponseInterceptor } from 'src/shared/interceptor';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomValidationPipe } from 'src/shared/pipe';
import { Balance1Api } from './balance.1.api';
import { CreateTransferRequestApi } from './dto-api/create-transfer.request.api';
import { Disbursement1Api } from './disbursement.1.api';
import { UpdateDisbursementCallbackSystemDto } from 'src/microservice/transaction/disbursement/dto-system/update-disbursement-callback.system.dto';
import { ReadPurchaseDateRequestApi } from './dto-api/read-purchase-date.request.api';
import { Pageable, Pagination } from 'src/shared/pagination';

@Controller()
@SkipReponseInterceptor()
export class Api1Controller {
  constructor(
    private readonly purchaseApi: Purchase1Api,
    private readonly balanceApi: Balance1Api,
    private readonly disbursementApi: Disbursement1Api,
  ) {}

  /**
   * PayIn
   */
  @Post('/open/v1/payin/purchase')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({ summary: 'Create a new purchase transaction (API)' })
  createQRIS(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreatePurchaseRequestApi,
  ) {
    console.log({ headers, body });
    return this.purchaseApi.create(headers, body);
  }

  @SystemApi()
  @Post(SERVICES.TRANSACTION.point.purchase_callback.path)
  @ApiTags('Merchant API', 'Internal')
  @ApiOperation({ summary: ' Callback Payin' })
  @ApiBody({ type: CreatePurchaseCallbackSystemDto })
  async callbackPayin(@Body() body: CreatePurchaseCallbackSystemDto) {
    return this.purchaseApi.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.point.purchase_callback.cmd })
  async callbackPayinTCP(
    @Payload(CustomValidationPipe) payload: CreatePurchaseCallbackSystemDto,
  ) {
    return this.purchaseApi.callback(payload);
  }

  @Get('/open/v1/payin/purchase/:transactionId')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Transaction ID',
  })
  findPurchaseByTransactionId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.purchaseApi.findByTransactionId(headers, transactionId);
  }

  @Get('/open/v1/payin/order/:orderId')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Order ID',
  })
  findPurchaseByOrderId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('orderId') orderId: string,
  ) {
    return this.purchaseApi.findByOrderId(headers, orderId);
  }

  @Get('/open/v1/payin/date')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Paid Date',
  })
  findPurchaseByDate(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Pagination() pageable: Pageable,
    @Query() filter: ReadPurchaseDateRequestApi,
  ) {
    return this.purchaseApi.findByPaidDate(headers, pageable, filter);
  }

  /**
   * Balance
   */
  @Get('/open/v1/payout/balance')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({ summary: 'Check current wallet balance (API)' })
  async balance(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
  ) {
    console.log({ headers });
    return this.balanceApi.checkBalance(headers);
  }

  /**
   * PayOut
   */
  @Post('/open/v1/payout/transfer')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Create a new Payout Transfer to bank/ewallet account (API)',
  })
  async createTransfer(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreateTransferRequestApi,
  ) {
    console.log({ headers, body });
    return this.disbursementApi.create(headers, body);
  }

  @SystemApi()
  @Post(SERVICES.TRANSACTION.point.disbursement_callback.path)
  @ApiTags('Merchant API', 'Internal')
  @ApiOperation({
    summary:
      'Pengubahan status berdasarkan external id dan code dari provider services',
  })
  @ApiBody({ type: UpdateDisbursementCallbackSystemDto })
  callbackPayout(@Body() body: UpdateDisbursementCallbackSystemDto) {
    return this.disbursementApi.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.point.disbursement_callback.cmd })
  async callbackPayoutTCP(
    @Payload(CustomValidationPipe) payload: UpdateDisbursementCallbackSystemDto,
  ) {
    return this.disbursementApi.callback(payload);
  }

  @Get('/open/v1/payout/transfer/:transactionId')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Transaction ID',
  })
  findTransferByTransactionId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('transactionId', ParseIntPipe) transactionId: number,
  ) {
    return this.disbursementApi.findByTransactionId(headers, transactionId);
  }

  @Get('/open/v1/payout/order/:orderId')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Order ID',
  })
  findTransferByOrderId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('orderId') orderId: string,
  ) {
    return this.disbursementApi.findByOrderId(headers, orderId);
  }

  @Get('/open/v1/payout/date')
  @MerchantApi()
  @ApiTags('Merchant API')
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Paid Date',
  })
  findTransferByDate(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Pagination() pageable: Pageable,
    @Query() filter: ReadPurchaseDateRequestApi,
  ) {
    return this.disbursementApi.findByPaidDate(headers, pageable, filter);
  }
}
