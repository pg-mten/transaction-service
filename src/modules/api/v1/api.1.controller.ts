import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
import { CustomValidationPipe, ParseIntegerPipe } from 'src/shared/pipe';
import { Balance1Api } from './balance.1.api';
import { CreateTransferRequestApi } from './dto-api/create-transfer.request.api';
import { Disbursement1Api } from './disbursement.1.api';
import { UpdateDisbursementCallbackSystemDto } from 'src/microservice/transaction/disbursement/dto-system/update-disbursement-callback.system.dto';
import { ReadPurchaseDateRequestApi } from './dto-api/read-purchase-date.request.api';
import { ReadTransferDateRequestApi } from './dto-api/read-transfer-date.request.api';
import { Pageable, Pagination } from 'src/shared/pagination';
import { CreatePurchaseResponseApi } from './dto-api/create-purchase.response.api';
import { WebhookPayinApi } from './dto-api/webhook-payin.api';
import { ReadPurchaseResponseApi } from './dto-api/read-purchase.response.api';
import { BalanceResponseApi } from './dto-api/balance.response.api';
import { CreateTransferResponseApi } from './dto-api/create-transfer.response.api';
import { WebhookPayoutApi } from './dto-api/webhook-payout.api';
import { ReadTransferDateResponseApi } from './dto-api/read-transfer-date.response.api';

@Controller()
@ApiTags('Merchant API', 'Api 1')
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
  @ApiOperation({ summary: 'Create a new purchase transaction (API)' })
  @ApiResponse({ type: CreatePurchaseResponseApi })
  createQRIS(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreatePurchaseRequestApi,
  ) {
    console.log({ headers, body });
    return this.purchaseApi.create(headers, body);
  }

  @SystemApi()
  @Post(SERVICES.TRANSACTION.point.purchase_callback.path)
  @ApiTags('Internal')
  @ApiOperation({ summary: ' Callback Payin' })
  @ApiBody({ type: CreatePurchaseCallbackSystemDto })
  @ApiResponse({ type: WebhookPayinApi })
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
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Transaction ID',
  })
  @ApiResponse({ type: ReadPurchaseResponseApi })
  findPurchaseByTransactionId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('transactionId', ParseIntegerPipe) transactionId: number,
  ) {
    return this.purchaseApi.findByTransactionId(headers, transactionId);
  }

  @Get('/open/v1/payin/order/:orderId')
  @MerchantApi()
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Order ID',
  })
  @ApiResponse({ type: ReadPurchaseResponseApi })
  findPurchaseByOrderId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('orderId') orderId: string,
  ) {
    return this.purchaseApi.findByOrderId(headers, orderId);
  }

  @Get('/open/v1/payin/date')
  @MerchantApi()
  @ApiOperation({
    summary: 'Get Payin Transaction Detail by Paid Date',
  })
  @ApiResponse({ type: ReadPurchaseResponseApi })
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
  @ApiOperation({ summary: 'Check current wallet balance (API)' })
  @ApiResponse({ type: BalanceResponseApi })
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
  @ApiOperation({
    summary: 'Create a new Payout Transfer to bank/ewallet account (API)',
  })
  @ApiResponse({ type: CreateTransferResponseApi })
  async createTransfer(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreateTransferRequestApi,
  ) {
    console.log({ headers, body });
    return this.disbursementApi.create(headers, body);
  }

  @SystemApi()
  @Post(SERVICES.TRANSACTION.point.disbursement_callback.path)
  @ApiTags('Internal')
  @ApiOperation({
    summary:
      'Pengubahan status berdasarkan external id dan code dari provider services',
  })
  @ApiBody({ type: UpdateDisbursementCallbackSystemDto })
  @ApiResponse({ type: WebhookPayoutApi })
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
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Transaction ID',
  })
  @ApiResponse({ type: ReadTransferDateResponseApi })
  findTransferByTransactionId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('transactionId', ParseIntegerPipe) transactionId: number,
  ) {
    return this.disbursementApi.findByTransactionId(headers, transactionId);
  }

  @Get('/open/v1/payout/order/:orderId')
  @MerchantApi()
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Order ID',
  })
  @ApiResponse({ type: ReadTransferDateResponseApi })
  findTransferByOrderId(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Param('orderId') orderId: string,
  ) {
    return this.disbursementApi.findByOrderId(headers, orderId);
  }

  @Get('/open/v1/payout/date')
  @MerchantApi()
  @ApiOperation({
    summary: 'Get Transfer Transaction Detail by Paid Date',
  })
  @ApiResponse({ type: ReadTransferDateResponseApi })
  findTransferByDate(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Pagination() pageable: Pageable,
    @Query() filter: ReadTransferDateRequestApi,
  ) {
    return this.disbursementApi.findByPaidDate(headers, pageable, filter);
  }
}
