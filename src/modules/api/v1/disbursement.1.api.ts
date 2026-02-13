import {
  BadGatewayException,
  Inject,
  Injectable,
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
import { TransactionHelper } from 'src/shared/helper';
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
  ) {}

  private readonly transactionType = TransactionTypeEnum.DISBURSEMENT;

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
      if (body.providerName === 'PDN') {
        const clientRes = await this.pdnProviderClient.disbursementTCP({
          ...body,
        });
        return clientRes.data!;
      } else if (body.providerName === 'INACASH') {
        const clientRes = await this.inacashProviderClient.disbursementTCP({
          ...body,
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
    body: CreateTransferRequestApi,
  ) {
    const merchantSignature: MerchantSignatureValidationSystemDto =
      await this.merchantSignatureClient.signatureValidationTCP({
        headers: headers,
        body: body,
        method: HttpMethodEnum.POST,
        path: '/open/v1/payout/transfer',
      });

    if (!merchantSignature || !merchantSignature.isValid) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Merchant Signature Not Valid'),
      );
    }

    const balance = await this.balanceService.checkBalanceMerchant(
      merchantSignature.userId,
    );

    if (balance.balanceActive.lessThan(body.amount)) {
      throw ResponseException.fromHttpExecption(
        new BadGatewayException('Balance insufficient'),
      );
    }

    const profileProvider =
      await this.profileProviderClient.findProfileProviderTCP({
        transactionType: this.transactionType,
        userId: merchantSignature.userId,
        userRole: TransactionUserRole.MERCHANT,
      });

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

    await this.prisma.$transaction(async (tx) => {
      const feeDto =
        await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
          merchantId: merchantSignature.userId,
          nominal: clientData.nominal,
          paymentMethodName: profileProvider.paymentMethodName,
          providerName: profileProvider.providerName,
        });

      const disbursement = await tx.disbursementTransaction.create({
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
    const codeExtract = TransactionHelper.extractCode(body.code);

    await this.prisma.$transaction(async (tx) => {
      const disbursement = await tx.disbursementTransaction.update({
        where: {
          code: body.code,
          merchantId: codeExtract.userId,
        },
        data: {
          status: body.status as TransactionStatusEnum,
        },
      });

      if (disbursement.status === TransactionStatusEnum.SUCCESS) {
        const feeDto =
          await this.feeCalculateClient.calculateDisbursementFeeConfigTCP({
            merchantId: disbursement.merchantId,
            providerName: disbursement.providerName,
            paymentMethodName: disbursement.paymentMethodName,
            nominal: disbursement.nominal,
          });

        const disbursementFeeDetails =
          await tx.disbursementFeeDetail.createManyAndReturn({
            data: this.feeDetailMapper({
              disbursementId: disbursement.id,
              feeDto,
            }),
          });

        console.log({ disbursementFeeDetails });

        await this.createBalanceLog({
          disbursementId: disbursement.id,
          merchantId: disbursement.merchantId,
          providerName: disbursement.providerName,
          paymentMethodName: disbursement.paymentMethodName,
          nominal: disbursement.nominal,
          feeDto,
        });
      }
    });
  }

  private async createBalanceLog(dto: {
    disbursementId: number;
    merchantId: number;
    providerName: string;
    paymentMethodName: string;
    nominal: Decimal;
    feeDto: DisbursementFeeSystemDto;
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
    if (lastBalanceMerchant.balanceActive <= dto.nominal) {
      throw new Error('Balance Tidak Mencukupi');
    }

    return Promise.all([
      this.prisma.merchantBalanceLog.create({
        data: {
          disbursementId: dto.disbursementId,
          merchantId: dto.merchantId,
          changeAmount: dto.nominal,
          balanceActive: lastBalanceMerchant.balanceActive?.minus(
            dto.feeDto.merchantFee.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
          transactionType: this.transactionType,
        },
      }),

      this.prisma.internalBalanceLog.create({
        data: {
          disbursementId: dto.disbursementId,
          merchantId: dto.merchantId,
          changeAmount: dto.feeDto.internalFee.nominal,
          balanceActive: lastBalanceInternal.balanceActive?.plus(
            dto.feeDto.internalFee.nominal,
          ),
          balancePending: lastBalanceInternal.balancePending,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          transactionType: this.transactionType,
        },
      }),

      this.prisma.agentBalanceLog.createMany({
        skipDuplicates: true,
        data: dto.feeDto.agentFee.agents.map((item) => {
          return {
            disbursementId: dto.disbursementId,
            agentId: item.id,
            changeAmount: item.nominal,
            balancePending:
              lastBalanceAgents.find((a) => a.agentId == item.id)
                ?.balancePending || new Decimal(0),
            balanceActive:
              lastBalanceAgents
                .find((a) => a.agentId == item.id)
                ?.balanceActive.plus(item.nominal) || new Decimal(0),
            transactionType: this.transactionType,
          } as Prisma.AgentBalanceLogCreateManyInput;
        }),
      }),
    ]);
  }

  private feeDetailMapper({
    disbursementId,
    feeDto,
  }: {
    disbursementId: number;
    feeDto: DisbursementFeeSystemDto;
  }): Prisma.DisbursementFeeDetailCreateManyInput[] {
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

    return result;
  }
}
