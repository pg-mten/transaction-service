import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseTransactionDto } from './dto/create-purchase.request.dto';
import {
  Prisma,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseException } from 'src/shared/exception';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';
import { PurchaseFeeDetailDto } from './dto/purchase-fee-detail.dto';
import { UpdateStatusPurchaseTransactionDto } from './dto/update-transaction-status.dto';
import { PurchaseFeeSystemDto } from 'src/microservice/config/dto-transaction-system/purchase-fee.system.dto';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { CreatePurchaseCallbackSystemDto } from 'src/microservice/transaction/purchase/dto-system/create-purchase-callback.system.dto';
import { InacashProviderClient } from 'src/microservice/provider/inacash/inacash.provider.client';
import { CreatePurchaseResponseDto } from './dto/create-purchase.response.dto';
import { TransactionHelper } from 'src/shared/helper/transaction.helper';
import { PdnProviderClient } from 'src/microservice/provider/pdn/pdn.provider.client';
import { ProfileProviderConfigClient } from 'src/microservice/config/profile-provider.config.client';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
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

  async create(dto: CreatePurchaseTransactionDto) {
    const code = TransactionHelper.createCode({
      transactionType: this.transactionType,
      userId: dto.merchantId,
      providerName: dto.providerName,
      paymentMethodName: dto.paymentMethodName,
    });

    console.log({ code });

    const clientData = await this.callProvider({
      code,
      merchantId: dto.merchantId,
      nominal: dto.nominal,
      providerName: dto.providerName,
    });

    const purchase = await this.prisma.purchaseTransaction.create({
      data: {
        code: code,
        merchantId: dto.merchantId,
        providerName: dto.providerName,
        paymentMethodName: dto.paymentMethodName,
        nominal: dto.nominal,
        netNominal: new Decimal(0),
        status: TransactionStatusEnum.PENDING,
      },
    });

    console.log('sudah sampai sini');
    console.log({ purchase });
    return new CreatePurchaseResponseDto({
      code,
      content: clientData.content,
      nominal: clientData.nominal,
      productCode: clientData.productCode,
      providerName: dto.providerName,
      paymentMethodName: dto.paymentMethodName,
    });
  }

  async callback(dto: CreatePurchaseCallbackSystemDto) {
    await this.prisma.$transaction(async (tx) => {
      const feeDto =
        await this.feeCalculateClient.calculatePurchaseFeeConfigTCP({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      console.log({ feeDto });

      const purchase = await tx.purchaseTransaction.upsert({
        where: {
          code: dto.code,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
        },
        create: {
          code: dto.code,
          externalId: dto.externalId,
          // referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
          netNominal: feeDto.merchantFee.netNominal,
          status: dto.status as TransactionStatusEnum,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
        update: {
          externalId: dto.externalId,
          netNominal: feeDto.merchantFee.netNominal,
          status: dto.status as TransactionStatusEnum,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
      });

      if (dto.status === TransactionStatusEnum.SUCCESS) {
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

      console.log({ purchase, feeDto });
    });
    return;
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

  async findOneThrow(id: number) {
    return this.prisma.purchaseTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterPurchaseDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowDate());

    const whereClause: Prisma.PurchaseTransactionWhereInput = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (providerName) whereClause.providerName = providerName;
    if (status) whereClause.status = status;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;

    const { skip, take } = paging(pageable);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.count({
        where: whereClause,
      }),
      this.prisma.purchaseTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          feeDetails: true,
        },
      }),
    ]);
    const purchaseDtos: PurchaseTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: PurchaseFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new PurchaseFeeDetailDto({ ...feeDetail }));
      }
      purchaseDtos.push(
        new PurchaseTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          settlementAt: DateHelper.fromJsDate(item.settlementAt),
          reconciliationAt: DateHelper.fromJsDate(item.reconciliationAt),
          createdAt: DateHelper.fromJsDate(item.createdAt)!,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<PurchaseTransactionDto>({
      pageable,
      total,
      data: purchaseDtos,
    });
  }

  /// TODO Buat apa ?
  async updateStatusTransactions(data: UpdateStatusPurchaseTransactionDto) {
    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseTransaction.update({
        where: {
          code: data.code,
        },
        data: {
          status: data.status,
          metadata: data.metadata,
          externalId: data.external_id,
        },
      });
    });
  }
}
