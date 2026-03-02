import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';

import { MerchantSignatureAuthClient } from 'src/microservice/merchant-signature/merchant-signature.auth.client';
import { MerchantSignatureHeaderDto } from 'src/microservice/merchant-signature/merchant-signature.header.decorator';
import { HttpMethodEnum } from 'src/shared/constant/auth.constant';

import { BalanceService } from 'src/modules/balance/balance.service';
import { ResponseException } from 'src/shared/exception';
import { ProfileProviderConfigClient } from 'src/microservice/config/profile-provider.config.client';
import { TransactionUserRole } from 'src/shared/constant/transaction.constant';
import { DtoHelper, TransactionHelper } from 'src/shared/helper';
import { ProviderDisbursementSystemDto } from 'src/microservice/provider';
import Decimal from 'decimal.js';
import { PRISMA_SERVICE } from 'src/modules/prisma/prisma.provider';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';
import { CreateTransferRequestApi } from './dto-api/create-transfer.request.api';
import { MerchantSignatureValidationSystemDto } from 'src/microservice/merchant-signature/merchant-signature-validation.system.dto';
import { CreateTransferResponseApi } from './dto-api/create-transfer.response.api';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { UpdateDisbursementCallbackSystemDto } from 'src/microservice/transaction/disbursement/dto-system/update-disbursement-callback.system.dto';
import { DisbursementFeeSystemDto } from 'src/microservice/config/dto-transaction-system/disbursement-fee.system.dto';
import { Pageable } from 'src/shared/pagination';
import { ReadTransferDateRequestApi } from './dto-api/read-transfer-date.request.api';
import { DisbursementService } from 'src/modules/disbursement/disbursement.service';
import { ReadTransferDateResponseApi } from './dto-api/read-transfer-date.response.api';
import { WebhookPayoutApi } from './dto-api/webhook-payout.api';
import { IS_TEST } from 'src/shared/constant/global.constant';
import axios from 'axios';

@Injectable()
export class Disbursement1Api {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient,
    private readonly merchantSignatureClient: MerchantSignatureAuthClient,
    private readonly balanceService: BalanceService,
    private readonly profileProviderClient: ProfileProviderConfigClient,
    private readonly inacashProviderClient: InacashProviderClient,
    private readonly pdnProviderClient: PdnProviderClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly disbursementService: DisbursementService,
  ) {}

  private readonly transactionType = TransactionTypeEnum.DISBURSEMENT;

  async findByTransactionId(
    headers: MerchantSignatureHeaderDto,
    transactionId: number,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: `/open/v1/payout/transfer/${transactionId}`,
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    try {
      const disbursement = await this.disbursementService.findOneUniqueThrow({
        id: transactionId,
      });

      return new ReadTransferDateResponseApi({
        transactionId: disbursement.id,
        orderId: disbursement.orderId,
        amount: disbursement.nominal,
        netAmount: disbursement.netNominal,
        fee: disbursement.nominal.minus(disbursement.netNominal),
        status: disbursement.status,
        paidAt: disbursement.paidAt?.toISOString() ?? null,
        paymentMethod: disbursement.paymentMethodName,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === 'P2025')
          throw ResponseException.fromHttpExecption(
            new NotFoundException(
              `Transfer with transaction id ${transactionId} not found`,
            ),
          );
    }
  }

  async findByOrderId(headers: MerchantSignatureHeaderDto, orderId: string) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: `/open/v1/payout/order/${orderId}`,
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    try {
      const disbursement = await this.disbursementService.findOneUniqueThrow({
        orderId: orderId,
      });

      return new ReadTransferDateResponseApi({
        transactionId: disbursement.id,
        orderId: disbursement.orderId,
        amount: disbursement.nominal,
        netAmount: disbursement.netNominal,
        fee: disbursement.nominal.minus(disbursement.netNominal),
        status: disbursement.status,
        paidAt: disbursement.paidAt?.toISOString() ?? null,
        paymentMethod: disbursement.paymentMethodName,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        if (error.code === 'P2025')
          throw ResponseException.fromHttpExecption(
            new NotFoundException(
              `Transfer with order id ${orderId} not found`,
            ),
          );
    }
  }

  async findByPaidDate(
    headers: MerchantSignatureHeaderDto,
    pageable: Pageable,
    filter: ReadTransferDateRequestApi,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: '',
        method: HttpMethodEnum.GET,
        path: `/open/v1/payout/date`,
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    const merchantId = merchantSignature.userId;

    return this.disbursementService.findByPaidDate(
      pageable,
      merchantId,
      filter,
    );
  }

  private async callProvider(body: {
    code: string;
    providerName: string;
    paymentMethodName: string;
    recipientBankCode: string;
    recipientBankName: string | null;
    recipientAccountNumber: string;
    nominal: Decimal;
  }): Promise<ProviderDisbursementSystemDto> {
    try {
      if (body.providerName === 'PDNT1') {
        const clientRes = await this.pdnProviderClient.disbursementTCP({
          ...body,
        });
        return clientRes;
      } else if (body.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.disbursementTCP({
          ...body,
        });

        const clientData = clientRes;
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
    body: CreateTransferRequestApi,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: DtoHelper.convertDecimalToNumber(
          body as unknown as Record<string, unknown>,
        ),
        method: HttpMethodEnum.POST,
        path: '/open/v1/payout/transfer',
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    const profileProvider =
      await this.profileProviderClient.findProfileProviderTCP({
        transactionType: this.transactionType,
        userId: merchantSignature.userId,
        userRole: TransactionUserRole.MERCHANT,
      });

    const feeDto =
      await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
        merchantId: merchantSignature.userId,
        nominal: body.amount,
        paymentMethodName: profileProvider.paymentMethodName,
        providerName: profileProvider.providerName,
      });

    const lastBalanceMerchant = await this.prisma.merchantBalanceLog.findFirst({
      where: { merchantId: merchantSignature.userId },
      orderBy: [{ id: 'desc' }],
      select: {
        balanceActive: true,
        balancePending: true,
      },
    });

    if (
      !lastBalanceMerchant ||
      lastBalanceMerchant.balanceActive.lessThan(feeDto.merchantFee.netNominal)
    ) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Balance insufficient'),
      );
    }

    const code = TransactionHelper.createCode({
      transactionType: this.transactionType,
      userId: merchantSignature.userId,
      providerName: profileProvider.providerName,
      paymentMethodName: profileProvider.paymentMethodName,
    });

    const clientData = await this.callProvider({
      code: code,
      paymentMethodName: profileProvider.paymentMethodName,
      providerName: profileProvider.providerName,
      nominal: body.amount,
      recipientAccountNumber: body.accountNumber,
      recipientBankCode: body.bankCode,
      recipientBankName: body.bankName,
    });

    const clientDataStatus = clientData.status as TransactionStatusEnum;
    if (clientDataStatus === TransactionStatusEnum.FAILED) {
      return this.createFailed(clientData, body);
    }

    const disbursement = await this.prisma.disbursementTransaction.create({
      data: {
        code: code,
        orderId: body.orderId,
        externalId: clientData.externalId,
        merchantId: merchantSignature.userId,
        providerName: profileProvider.providerName,
        paymentMethodName: profileProvider.paymentMethodName,
        recipientName: body.accountName,
        recipientBankCode: body.bankCode,
        recipientAccount: body.accountNumber,
        recipientBankName: body.bankName,
        nominal: clientData.nominal,
        netNominal: feeDto.merchantFee.netNominal,
        metadata: clientData.metadata as Prisma.InputJsonValue,
        status: TransactionStatusEnum.PENDING,
      },
    });

    return new CreateTransferResponseApi({
      transactionId: disbursement.id,
      orderId: body.orderId,
      amount: body.amount,
      netAmount: disbursement.netNominal,
      fee: feeDto.merchantFee.nominal.minus(feeDto.merchantFee.netNominal),
      status: TransactionStatusEnum.PENDING,
      description: 'Create Transfer Bank/EWallet succesfully',
      currency: 'IDR',
      bankCode: body.bankCode,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
      createdAt: disbursement.createdAt.toISOString(),
    });
  }

  private async createFailed(
    clientData: ProviderDisbursementSystemDto,
    body: CreateTransferRequestApi,
  ) {
    const { userId, providerName, paymentMethodName } =
      TransactionHelper.extractCode(clientData.code);

    const disbursement = await this.prisma.disbursementTransaction.create({
      data: {
        code: clientData.code,
        orderId: body.orderId,
        externalId: clientData.externalId,
        merchantId: userId,
        providerName: providerName,
        paymentMethodName: paymentMethodName,
        recipientBankCode: body.bankCode,
        recipientBankName: body.bankName ?? body.bankCode,
        recipientName: body.accountName,
        recipientAccount: body.accountNumber,
        nominal: body.amount,
        netNominal: new Decimal(0),
        metadata: clientData.metadata as Prisma.InputJsonValue,
        status: TransactionStatusEnum.FAILED,
      },
    });

    return new CreateTransferResponseApi({
      transactionId: disbursement.id,
      orderId: body.orderId,
      amount: body.amount,
      netAmount: new Decimal(0),
      fee: new Decimal(0),
      status: TransactionStatusEnum.FAILED,
      description: 'Create Transfer Bank/EWallet failed',
      currency: 'IDR',
      bankCode: body.bankCode,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
      createdAt: disbursement.createdAt.toISOString(),
    });
  }

  async callback(body: UpdateDisbursementCallbackSystemDto) {
    const { userId, paymentMethodName, providerName } =
      TransactionHelper.extractCode(body.code);
    const feeDto =
      await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
        merchantId: userId,
        providerName: providerName,
        paymentMethodName: paymentMethodName,
        nominal: body.nominal,
      });

    const webhookApi = this.prisma.$transaction(
      async (tx) => {
        const disbursement = await tx.disbursementTransaction.update({
          where: {
            code: body.code,
            merchantId: userId,
            paymentMethodName,
            providerName,
          },
          data: {
            externalId: body.externalId,
            netNominal: feeDto.merchantFee.netNominal,
            status: body.status as TransactionStatusEnum,
            paidAt: body.paidAt?.toJSDate() ?? null,
            metadata: body.metadata as Prisma.InputJsonValue,
          },
        });
        console.log({ feeDto, disbursement });

        if (body.status === TransactionStatusEnum.SUCCESS) {
          await this.createFeeDetail({
            tx,
            disbursementId: disbursement.id,
            feeDto,
          });

          await this.createBalanceLog({
            tx,
            disbursementId: disbursement.id,
            merchantId: disbursement.merchantId,
            providerName: disbursement.providerName,
            paymentMethodName: disbursement.paymentMethodName,
            nominal: disbursement.nominal,
            feeDto,
          });

          return new WebhookPayoutApi({
            transactionId: disbursement.id,
            orderId: disbursement.orderId,
            amount: disbursement.nominal,
            netAmount: disbursement.netNominal,
            fee: disbursement.nominal.minus(disbursement.netNominal),
            status: disbursement.status,
            paidAt: disbursement.paidAt?.toISOString() ?? null,
            paymentMethod: disbursement.paymentMethodName,
          });
        }
      },
      { maxWait: 15_000, timeout: 30_000 },
    );

    if (IS_TEST) return webhookApi;

    const merchantSignatureUrl =
      await this.merchantSignatureClient.findMerchantUrlTCP({
        userId: userId,
      });

    if (!merchantSignatureUrl || !merchantSignatureUrl.payoutUrl) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException(
          `Merchant Payout URL Not Found userId: ${userId}`,
        ),
      );
    }

    // TODO: Implement proper webhook retry mechanism (e.g. exponential backoff / queue)
    // instead of silently swallowing delivery failures
    try {
      await axios.post(merchantSignatureUrl.payoutUrl, webhookApi);
    } catch (error) {
      console.error(
        `[Disbursement1Api] Failed to deliver webhook to ${merchantSignatureUrl.payoutUrl}:`,
        error?.message ?? error,
      );
    }
    return webhookApi;
  }

  private async createBalanceLog(dto: {
    tx: Prisma.TransactionClient;
    disbursementId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: DisbursementFeeSystemDto;
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

    if (
      !lastBalanceMerchant ||
      lastBalanceMerchant.balanceActive.lessThan(
        dto.feeDto.merchantFee.netNominal,
      )
    ) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Balance insufficient'),
      );
    }

    await dto.tx.merchantBalanceLog.create({
      data: {
        transactionType: this.transactionType,
        disbursementId: dto.disbursementId,
        merchantId: dto.merchantId,
        changeAmount: dto.feeDto.merchantFee.netNominal,
        balanceActive: lastBalanceMerchant.balanceActive?.minus(
          dto.feeDto.merchantFee.netNominal,
        ),
        balancePending: lastBalanceMerchant.balancePending,
      },
    });

    await dto.tx.internalBalanceLog.create({
      data: {
        transactionType: this.transactionType,
        disbursementId: dto.disbursementId,
        merchantId: dto.merchantId,
        changeAmount: dto.feeDto.internalFee.nominal,
        balanceActive: (
          lastBalanceInternal?.balanceActive ?? new Decimal(0)
        )?.plus(dto.feeDto.internalFee.nominal),
        balancePending: lastBalanceInternal?.balancePending ?? new Decimal(0),
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
          disbursementId: dto.disbursementId,
          agentId: agent.id,
          changeAmount: agent.nominal,
          balancePending: lastBalance?.balancePending ?? new Decimal(0),
          balanceActive: (lastBalance?.balanceActive ?? new Decimal(0)).plus(
            agent.nominal,
          ),
        } as Prisma.AgentBalanceLogCreateManyInput;
      }),
    });
  }

  private async createFeeDetail({
    tx,
    disbursementId,
    feeDto,
  }: {
    tx: Prisma.TransactionClient;
    disbursementId: number;
    feeDto: DisbursementFeeSystemDto;
  }) {
    const result: Prisma.DisbursementFeeDetailCreateManyInput[] = [];
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
      disbursementId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      disbursementId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      disbursementId,
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
        disbursementId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        feeFixed: agentFee.nominal,
        feePercentage: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return tx.disbursementFeeDetail.createManyAndReturn({
      data: result,
    });
  }
}
