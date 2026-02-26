import { BadGatewayException, Injectable } from '@nestjs/common';
import { BalanceService } from 'src/modules/balance/balance.service';
import { BalanceResponseApi } from './dto-api/balance.response.api';
import { MerchantSignatureAuthClient } from 'src/microservice/merchant-signature/merchant-signature.auth.client';
import { MerchantSignatureValidationSystemDto } from 'src/microservice/merchant-signature/merchant-signature-validation.system.dto';
import { MerchantSignatureHeaderDto } from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { HttpMethodEnum } from 'src/shared/constant/auth.constant';
import { ResponseException } from 'src/shared/exception';

@Injectable()
export class Balance1Api {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
  ) {}

  async checkBalance(headers: MerchantSignatureHeaderDto) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: '/open/v1/payout/balance',
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    const balance = await this.balanceService.checkBalanceMerchant(
      merchantSignature.userId,
    );

    return new BalanceResponseApi({
      userId: merchantSignature.userId,
      balanceActive: balance.balanceActive,
      balancePending: balance.balancePending,
      currency: 'IDR',
      message: 'Check balance successfully',
    });
  }
}
