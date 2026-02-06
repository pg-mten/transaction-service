import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MerchantSignatureHeader,
  MerchantSignatureHeaderDto,
} from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { MerchantApi } from 'src/microservice/auth/decorator/merchant.decorator';
import { CreatePurchaseRequestApi } from './dto-api/create-purchase.request.api';
import { Purchase1Api } from './purchase.1.api';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { SERVICES } from 'src/shared/constant/client.constant';
import { ResponseInterceptor } from 'src/shared/interceptor';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomValidationPipe } from 'src/shared/pipe';

@Controller()
@MerchantApi()
export class Api1Controller {
  constructor(private readonly purchaseApi: Purchase1Api) {}

  @Post('/open/v1/payin/purchase')
  @ApiTags('Mercant API')
  @ApiOperation({ summary: 'Create a new purchase transaction (API)' })
  createQRIS(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreatePurchaseRequestApi,
  ) {
    console.log({ headers, body });
    return this.purchaseApi.create(headers, body);
  }

  @Post('transactions/purchase/internal/callback')
  @ApiTags('Internal')
  @ApiOperation({ summary: 'untuk update status dari provider services' })
  @ApiBody({ type: CreatePurchaseCallbackSystemDto })
  async callback(@Body() body: CreatePurchaseCallbackSystemDto) {
    return this.purchaseApi.callback(body);
  }

  @MessagePattern({ cmd: SERVICES.TRANSACTION.cmd.purchase_callback })
  @UseInterceptors(ResponseInterceptor)
  async callbackTCP(
    @Payload(CustomValidationPipe) payload: CreatePurchaseCallbackSystemDto,
  ) {
    return this.purchaseApi.callback(payload);
  }
}
