import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
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
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { PurchaseFeeSystemDto } from 'src/microservice/config/dto-transaction-system/purchase-fee.system.dto';
import { BalanceService } from 'src/modules/balance/balance.service';
import axios from 'axios';
import { WebhookPayinApi } from './dto-api/webhook-payin.api';
import { MerchantSignatureValidationSystemDto } from 'src/microservice/merchant-signature/merchant-signature-validation.system.dto';

@Injectable()
export class Purchase1Api {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
    private readonly profileProviderClient: ProfileProviderConfigClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
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
  ): Promise<CreatePurchaseResponseApi> {
    const merchantSignature: MerchantSignatureValidationSystemDto =
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
      transactionId: purchase.id,
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

  async callback(
    body: CreatePurchaseCallbackSystemDto,
  ): Promise<WebhookPayinApi> {
    const { paymentMethodName, providerName, userId } =
      TransactionHelper.extractCode(body.code);
    const weebhookApi = await this.prisma.$transaction(async (tx) => {
      const feeDto =
        await this.feeCalculateClient.calculatePurchaseFeeConfigTCP({
          merchantId: userId,
          nominal: body.nominal,
          paymentMethodName: paymentMethodName,
          providerName: providerName,
        });

      const purchase = await tx.purchaseTransaction.update({
        where: {
          code: body.code,
          merchantId: userId,
          paymentMethodName,
          providerName,
        },
        data: {
          externalId: body.externalId,
          netNominal: feeDto.merchantFee.netNominal,
          paidAt: body.paidAt.toJSDate(),
          status: body.status as TransactionStatusEnum,
          metadata: body.metadata as Prisma.InputJsonValue,
        },
      });

      if (body.status === TransactionStatusEnum.SUCCESS) {
        const purchsaeFeeDetails =
          await tx.purchaseFeeDetail.createManyAndReturn({
            data: this.feeDetailMapper({
              purchaseId: purchase.id,
              feeDto,
            }),
          });
        console.log({ purchsaeFeeDetails });

        await this.createBalanceLog({
          purchaseId: purchase.id,
          merchantId: purchase.merchantId,
          providerName: purchase.providerName,
          paymentMethodName: purchase.paymentMethodName,
          nominal: purchase.nominal,
          feeDto: feeDto,
        });
      }

      return new WebhookPayinApi({
        purchaseId: purchase.id,
        orderId: purchase.orderId,
        amount: purchase.nominal.toFixed(2),
        status: purchase.status,
        paidAt: purchase.paidAt!.toISOString(),
        paymentMethod: purchase.paymentMethodName,
      });
    });
    const merchantSignatureUrl =
      await this.merchantSignatureClient.findMerchantUrlTCP({
        userId: userId,
      });

    if (!merchantSignatureUrl || !merchantSignatureUrl.payinUrl) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException(
          `Merchant Payin URL Not Found userId: ${userId}`,
        ),
      );
    }

    return axios.post(merchantSignatureUrl.payinUrl, weebhookApi);
  }

  private async createBalanceLog(dto: {
    purchaseId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: PurchaseFeeSystemDto;
  }) {
    const agentIds: number[] = dto.feeDto.agentFee.agents.map(
      (agent) => agent.id,
    );
    const lastBalanceMerchant = await this.balanceService.checkBalanceMerchant(
      dto.merchantId,
    );
    const lastBalanceInternal =
      await this.balanceService.checkBalanceInternal();
    const lastBalanceAgents =
      await this.balanceService.checkBalanceAgents(agentIds);

    /// TODO ResponseException ValidityLogic (statusCode: 419 / 422 / 400)
    // if (lastBalanceMerchant.balanceActive <= dto.nominal) {
    //   throw new Error('Balance Tidak Mencukupi');
    // }

    return Promise.all([
      this.prisma.merchantBalanceLog.create({
        data: {
          transactionType: this.transactionType,
          purchaseId: dto.purchaseId,
          merchantId: dto.merchantId,
          changeAmount: dto.nominal, // TODO Bukannya harusnya netNominal ?
          balanceActive: lastBalanceMerchant.balanceActive?.minus(
            dto.feeDto.merchantFee.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
        },
      }),

      this.prisma.internalBalanceLog.create({
        data: {
          transactionType: this.transactionType,
          purchaseId: dto.purchaseId,
          merchantId: dto.merchantId,
          changeAmount: dto.feeDto.internalFee.nominal,
          balanceActive: lastBalanceInternal.balanceActive?.plus(
            dto.feeDto.internalFee.nominal,
          ),
          balancePending: lastBalanceInternal.balancePending,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
        },
      }),

      this.prisma.agentBalanceLog.createMany({
        skipDuplicates: true,
        data: dto.feeDto.agentFee.agents.map((item) => {
          return {
            transactionType: this.transactionType,
            purchaseId: dto.purchaseId,
            agentId: item.id,
            changeAmount: item.nominal,
            balancePending:
              lastBalanceAgents.find((a) => a.agentId == item.id)
                ?.balancePending || new Decimal(0),
            balanceActive:
              lastBalanceAgents
                .find((a) => a.agentId == item.id)
                ?.balanceActive.plus(item.nominal) || new Decimal(0),
          } as Prisma.AgentBalanceLogCreateManyInput;
        }),
      }),
    ]);
  }

  private feeDetailMapper({
    purchaseId,
    feeDto,
  }: {
    purchaseId: number;
    feeDto: PurchaseFeeSystemDto;
  }): Prisma.PurchaseFeeDetailCreateManyInput[] {
    const result: Prisma.PurchaseFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = feeDto;
    if (!merchantFee || !agentFee || !providerFee || !internalFee) {
      throw ResponseException.fromHttpExecption(
        new UnprocessableEntityException('Some of the response is null'),
        {
          merchantFee,
          agentFee,
          providerFee,
          internalFee,
        },
      );
    }

    /**
     * Merchant
     */
    result.push({
      purchaseId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      purchaseId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      purchaseId,
      type: 'INTERNAL',
      feeFixed: internalFee.feeFixed,
      feePercentage: internalFee.feePercentage,
      nominal: internalFee.nominal,
    });

    /**
     * Agent
     */
    for (const agentFeeEach of agentFee.agents) {
      result.push({
        purchaseId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        feeFixed: agentFee.nominal,
        feePercentage: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return result;
  }
}
