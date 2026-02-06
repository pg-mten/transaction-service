import { BadGatewayException, Injectable } from '@nestjs/common';
import { TransactionStatusEnum, TransactionTypeEnum } from '@prisma/client';
import Decimal from 'decimal.js';
import { MerchantSignatureHeaderDto } from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ResponseException } from 'src/shared/exception';
import { CreatePurchaseRequestApi } from './dto-api/create-purchase.request.api';
import { MerchantSignatureAuthClient } from 'src/microservice/merchant-signature/merchant-signature.auth.client';
import { HttpMethodEnum } from 'src/shared/constant/auth.constant';
import { TransactionHelper } from 'src/shared/helper';
import { ProfileProviderConfigClient } from 'src/microservice/config/profile-provider.config.client';
import { TransactionUserRole } from 'src/shared/constant/transaction.constant';
import {
  CreatePurchaseResponseApi,
  CreatePurchaseResponseQRApi,
} from './dto-api/create-purchase.response.api';

@Injectable()
export class Purchase1Api {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
    private readonly profileProviderClient: ProfileProviderConfigClient,
  ) {}

  private readonly transactionType = TransactionTypeEnum.PURCHASE;

  private async callProvider(dto: {
    code: string;
    merchantId: number;
    providerName: string;
    nominal: Decimal;
    expireSecond: number;
  }) {
    try {
      if (dto.providerName === 'PDN') {
        const clientRes = await this.pdnProviderClient.purchaseQRISTCP({
          ...dto,
        });
        return clientRes.data!;
      } else if (dto.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.purchaseQRISTCP({
          ...dto,
        });
        const clientData = clientRes.data!;
        return clientData;
      } else
        throw ResponseException.fromHttpExecption(
          new BadGatewayException('Provider Name Not Found'),
        );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async create(
    headers: MerchantSignatureHeaderDto,
    body: CreatePurchaseRequestApi,
  ) {
    const merchantSignature =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: body,
        method: HttpMethodEnum.POST,
        path: '/open/v1/payin/purchase/qris',
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    const profileProvider =
      await this.profileProviderClient.findProfileProviderTCP({
        userId: merchantSignature.userId,
        userRole: TransactionUserRole.MERCHANT,
        transactionType: this.transactionType,
      });

    const code = TransactionHelper.createCode({
      transactionType: this.transactionType,
      userId: merchantSignature.userId,
      providerName: profileProvider.providerName,
      paymentMethodName: profileProvider.paymentMethodName,
    });

    const clientData = await this.callProvider({
      code: code,
      merchantId: merchantSignature.userId,
      providerName: profileProvider.providerName,
      nominal: new Decimal(body.amount),
      expireSecond: body.expireSecond ?? 900,
    });

    const purchase = await this.prisma.purchaseTransaction.create({
      data: {
        code: code,
        orderId: body.orderId,
        expiresAt: clientData.expiresAt.toJSDate(),
        merchantId: merchantSignature.userId,
        externalId: clientData.externalId,
        nominal: body.amount,
        netNominal: new Decimal(0),
        paymentMethodName: profileProvider.paymentMethodName,
        providerName: profileProvider.providerName,
        status: TransactionStatusEnum.PENDING,
      },
    });

    return new CreatePurchaseResponseApi({
      purchaseId: purchase.id,
      orderId: body.orderId,
      status: purchase.status,
      message: 'Purchase created successfully',
      paymentMethod: profileProvider.paymentMethodName,
      qr: new CreatePurchaseResponseQRApi({
        qrString: clientData.content,
        expiresAt: clientData.expiresAt,
      }),
    });
  }
}
