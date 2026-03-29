import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import Decimal from 'decimal.js';
import { MerchantSignatureHeaderDto } from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';
import { PrismaClient } from '@prisma/client';
import { PRISMA_SERVICE } from 'src/modules/prisma/prisma.provider';
import { ApiError } from 'src/shared/exception';
import { CreatePurchaseRequestApi } from './dto-api/create-purchase.request.api';
import { MerchantSignatureAuthClient } from 'src/microservice/merchant-signature/merchant-signature.auth.client';
import { HttpMethodEnum } from 'src/shared/constant/auth.constant';
import { DateHelper, DtoHelper, TransactionHelper } from 'src/shared/helper';
import { ProfileProviderConfigClient } from 'src/microservice/config/profile-provider.config.client';
import {
  ProviderName,
  TransactionUserRole,
} from 'src/shared/constant/transaction.constant';
import {
  CreatePurchaseResponseApi,
  CreatePurchaseResponseQRApi,
} from './dto-api/create-purchase.response.api';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { PurchaseFeeSystemDto } from 'src/microservice/config/dto-transaction-system/purchase-fee.system.dto';
import axios from 'axios';
import { WebhookPayinApi } from './dto-api/webhook-payin.api';
import { MerchantSignatureValidationSystemDto } from 'src/microservice/merchant-signature/merchant-signature-validation.system.dto';
import { PurchaseService } from 'src/modules/purchase/purchase.service';
import { ReadPurchaseResponseApi } from './dto-api/read-purchase.response.api';
import { ReadPurchaseDateRequestApi } from './dto-api/read-purchase-date.request.api';
import { Pageable } from 'src/shared/pagination';
import { IS_TEST } from 'src/shared/constant/global.constant';
import { ZipayProviderClient } from 'src/microservice/provider/zipay/zipay.provider.client';

@Injectable()
export class Purchase1Api {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
    private readonly profileProviderClient: ProfileProviderConfigClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly purchaseService: PurchaseService,
    private readonly zipayProviderClient: ZipayProviderClient,
  ) {}

  private readonly transactionType = TransactionTypeEnum.PURCHASE;

  async findByTransactionId(
    headers: MerchantSignatureHeaderDto,
    transactionId: number,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: `/open/v1/payin/purchase/${transactionId}`,
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ApiError.invalidMerchantSignature();
    }

    try {
      const purchase = await this.prisma.purchaseTransaction.findFirstOrThrow({
        where: {
          id: transactionId,
          merchantId: merchantSignature.userId,
        },
      });

      return new ReadPurchaseResponseApi({
        transactionId: purchase.id,
        orderId: purchase.orderId,
        amount: purchase.nominal,
        netAmount: purchase.netNominal,
        fee: purchase.nominal.minus(purchase.netNominal),
        paidAt: purchase.paidAt?.toISOString() ?? null,
        paymentMethod: purchase.paymentMethodName,
        status: purchase.status,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === 'P2025')
          throw ApiError.purchaseNotFound('transaction ID', transactionId);
      throw error;
    }
  }

  async findByOrderId(headers: MerchantSignatureHeaderDto, orderId: string) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: `/open/v1/payin/order/${orderId}`,
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ApiError.invalidMerchantSignature();
    }

    try {
      const purchase = await this.prisma.purchaseTransaction.findFirstOrThrow({
        where: {
          orderId,
          merchantId: merchantSignature.userId,
        },
      });

      return new ReadPurchaseResponseApi({
        transactionId: purchase.id,
        orderId: purchase.orderId,
        amount: purchase.nominal,
        netAmount: purchase.netNominal,
        fee: purchase.nominal.minus(purchase.netNominal),
        paidAt: purchase.paidAt?.toISOString() ?? null,
        paymentMethod: purchase.paymentMethodName,
        status: purchase.status,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === 'P2025')
          throw ApiError.purchaseNotFound('order ID', orderId);
      throw error;
    }
  }

  async findByPaidDate(
    headers: MerchantSignatureHeaderDto,
    pageable: Pageable,
    filter: ReadPurchaseDateRequestApi,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: '/open/v1/payin/date',
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ApiError.invalidMerchantSignature();
    }
    if (filter.from.toMillis() > filter.to.toMillis()) {
      throw ApiError.dateRangeInvalid();
    }
    const merchantId = merchantSignature.userId;

    return this.purchaseService.findByPaidDate(pageable, merchantId, filter);
  }

  private async callProvider(dto: {
    code: string;
    merchantId: number;
    providerName: string;
    nominal: Decimal;
    expireSecond: number;
  }) {
    try {
      if (dto.providerName === ProviderName.PDNT1) {
        const clientRes = await this.pdnProviderClient.purchaseQRISTCP({
          ...dto,
        });
        return clientRes;
      } else if (dto.providerName === ProviderName.ZIPAY) {
        const clientRes = await this.zipayProviderClient.purchaseQRISTCP({
          ...dto,
        });
        return clientRes;
      } else if (dto.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.purchaseQRISTCP({
          ...dto,
        });
        const clientData = clientRes;
        return clientData;
      } else throw ApiError.unsupportedProvider(dto.providerName);
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
        body: DtoHelper.convertDecimalToNumber(
          body as unknown as Record<string, unknown>,
        ),
        method: HttpMethodEnum.POST,
        path: '/open/v1/payin/purchase',
      });

    /// TODO Ketika Upstream menggunakan model NMID (National Merchant ID)
    // merchantSignature.nmid

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ApiError.invalidMerchantSignature();
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
    console.log({ clientData, date: DateHelper.now() });

    let purchase;
    try {
      purchase = await this.prisma.purchaseTransaction.create({
        data: {
          code: code,
          orderId: body.orderId,
          expiresAt: DateHelper.from(clientData.expiresAt).toJSDate(),
          merchantId: merchantSignature.userId,
          externalId: clientData.externalId,
          nominal: body.amount,
          netNominal: new Decimal(0),
          paymentMethodName: profileProvider.paymentMethodName,
          providerName: profileProvider.providerName,
          status: TransactionStatusEnum.PENDING,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw ApiError.orderIdConflict('Purchase', body.orderId);
      }
      throw error;
    }

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
    const feeDto = await this.feeCalculateClient.calculatePurchaseFeeConfigTCP({
      merchantId: userId,
      nominal: body.nominal,
      paymentMethodName: paymentMethodName,
      providerName: providerName,
    });
    let webhookApi: WebhookPayinApi;
    try {
      webhookApi = await this.prisma.$transaction(
        async (tx) => {
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
              paidAt: body.paidAt?.toJSDate() ?? null,
              status: body.status as TransactionStatusEnum,
              metadata: body.metadata as Prisma.InputJsonValue,
            },
          });

          console.log({ feeDto, purchase });

          if (body.status === TransactionStatusEnum.SUCCESS) {
            await this.createFeeDetail({
              tx,
              purchaseId: purchase.id,
              feeDto: feeDto,
            });

            await this.createBalanceLog({
              tx,
              purchaseId: purchase.id,
              merchantId: purchase.merchantId,
              providerName: purchase.providerName,
              paymentMethodName: purchase.paymentMethodName,
              nominal: purchase.nominal,
              feeDto: feeDto,
            });
          }

          return new WebhookPayinApi({
            transactionId: purchase.id,
            orderId: purchase.orderId,
            amount: purchase.nominal,
            netAmount: purchase.netNominal,
            fee: purchase.nominal.minus(purchase.netNominal),
            status: purchase.status,
            paidAt: purchase.paidAt?.toISOString() ?? null,
            paymentMethod: purchase.paymentMethodName,
          });
        },
        {
          maxWait: 15_000,
          timeout: 30_000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw ApiError.purchaseNotFound('callback code', `'${body.code}'`);
      }
      throw error;
    }

    if (IS_TEST) return webhookApi;

    const merchantSignatureUrl =
      await this.merchantSignatureClient.findMerchantUrlTCP({
        userId: userId,
      });

    if (!merchantSignatureUrl || !merchantSignatureUrl.payinUrl) {
      console.warn(
        `[Purchase1Api] Merchant payin URL not found for user ID ${userId}`,
      );
      return webhookApi;
    }

    // TODO: Implement proper webhook retry mechanism (e.g. exponential backoff / queue)
    // instead of silently swallowing delivery failures
    try {
      await axios.post(merchantSignatureUrl.payinUrl, webhookApi);
    } catch (error) {
      console.error(
        `[Purchase1Api] Failed to deliver webhook to ${merchantSignatureUrl.payinUrl}:`,
        error?.message ?? error,
      );
    }
    return webhookApi;
  }

  private async createBalanceLog(dto: {
    tx: Prisma.TransactionClient;
    purchaseId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: PurchaseFeeSystemDto;
  }) {
    const agentIds: number[] = Array.from(
      new Set(dto.feeDto.agentFee.agents.map((agent) => agent.id)),
    ).sort((a, b) => a - b);

    // Serialize shared balance chains to prevent stale baseline reads.
    await dto.tx.$executeRaw`SELECT pg_advisory_xact_lock(30, 0)`;
    await dto.tx
      .$executeRaw`SELECT pg_advisory_xact_lock(10, ${dto.merchantId})`;
    for (const agentId of agentIds) {
      await dto.tx.$executeRaw`SELECT pg_advisory_xact_lock(20, ${agentId})`;
    }

    const lastBalanceMerchant = await dto.tx.merchantBalanceLog.findFirst({
      where: { merchantId: dto.merchantId },
      orderBy: [{ id: 'desc' }],
      select: {
        balanceActive: true,
        balancePending: true,
      },
    });
    const lastBalanceInternal = await dto.tx.internalBalanceLog.findFirst({
      orderBy: [{ id: 'desc' }],
      select: {
        balanceActive: true,
        balancePending: true,
      },
    });
    const lastBalanceAgents = await dto.tx.agentBalanceLog.findMany({
      where: { agentId: { in: agentIds } },
      distinct: ['agentId'],
      orderBy: [{ id: 'desc' }],
      select: {
        agentId: true,
        balanceActive: true,
        balancePending: true,
      },
    });

    /// TODO ResponseException ValidityLogic (statusCode: 419 / 422 / 400)
    // if (lastBalanceMerchant.balanceActive <= dto.nominal) {
    //   throw new Error('Balance Tidak Mencukupi');
    // }

    await dto.tx.merchantBalanceLog.create({
      data: {
        transactionType: this.transactionType,
        purchaseId: dto.purchaseId,
        merchantId: dto.merchantId,
        changeAmount: dto.feeDto.merchantFee.netNominal,
        balanceActive: lastBalanceMerchant?.balanceActive ?? new Decimal(0),
        balancePending: (
          lastBalanceMerchant?.balancePending ?? new Decimal(0)
        ).plus(dto.feeDto.merchantFee.netNominal),
      },
    });

    await dto.tx.internalBalanceLog.create({
      data: {
        transactionType: this.transactionType,
        purchaseId: dto.purchaseId,
        merchantId: dto.merchantId,
        changeAmount: dto.feeDto.internalFee.nominal,
        balanceActive: lastBalanceInternal?.balanceActive ?? new Decimal(0),
        balancePending: (
          lastBalanceInternal?.balancePending ?? new Decimal(0)
        ).plus(dto.feeDto.internalFee.nominal),
        providerName: dto.providerName,
        paymentMethodName: dto.paymentMethodName,
      },
    });

    await dto.tx.agentBalanceLog.createMany({
      skipDuplicates: true,
      data: dto.feeDto.agentFee.agents.map((agent) => {
        const lastBalance = lastBalanceAgents.find(
          (a) => a.agentId === agent.id,
        );
        return {
          transactionType: this.transactionType,
          purchaseId: dto.purchaseId,
          agentId: agent.id,
          changeAmount: agent.nominal,
          balancePending: (lastBalance?.balancePending ?? new Decimal(0)).plus(
            agent.nominal,
          ),
          balanceActive: lastBalance?.balanceActive ?? new Decimal(0),
        } as Prisma.AgentBalanceLogCreateManyInput;
      }),
    });

    return;
  }

  private async createFeeDetail({
    tx,
    purchaseId,
    feeDto,
  }: {
    tx: Prisma.TransactionClient;
    purchaseId: number;
    feeDto: PurchaseFeeSystemDto;
  }) {
    const result: Prisma.PurchaseFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = feeDto;
    if (!merchantFee || !agentFee || !providerFee || !internalFee) {
      throw ApiError.feeConfigInvalid({
        merchantFee,
        agentFee,
        providerFee,
        internalFee,
      });
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
        feeFixed: agentFeeEach.nominal,
        feePercentage: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }
    return tx.purchaseFeeDetail.createManyAndReturn({
      data: result,
    });
  }
}
