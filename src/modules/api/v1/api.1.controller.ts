import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MerchantSignatureHeader,
  MerchantSignatureHeaderDto,
} from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { MerchantApi } from 'src/microservice/auth/decorator/merchant.decorator';
import { CreatePurchaseRequestApi } from './dto-api/create-purchase.request.api';
import { Purchase1Api } from './purchase.1.api';

@Controller('/open/v1')
@ApiTags('Mercant API')
@MerchantApi()
export class Api1Controller {
  constructor(private readonly purchaseApi: Purchase1Api) {}

  @Post('/payin/purchase')
  @ApiOperation({ summary: 'Create a new purchase transaction (API)' })
  createQRIS(
    @MerchantSignatureHeader() headers: MerchantSignatureHeaderDto,
    @Body() body: CreatePurchaseRequestApi,
  ) {
    console.log({ headers, body });
    return this.purchaseApi.create(headers, body);
  }
}
