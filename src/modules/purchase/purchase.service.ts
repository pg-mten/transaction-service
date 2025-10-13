import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase.request.dto';
import { Prisma, TransactionStatusEnum } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseException } from 'src/exception/response.exception';
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

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private readonly balanceService: BalanceService,
    private readonly inacashProviderClient: InacashProviderClient,
  ) {}

  async createPurchase(body: CreatePurchaseRequestDto) {
    const code = `${DateHelper.now().toUnixInteger()}#${body.merchantId}#PURCHASE#${body.providerName}#${body.paymentMethodName}`;

    if (body.providerName === 'INACASH') {
      const clientRes = await this.inacashProviderClient.purchaseQRISTCP({
        code: code,
        merchantId: body.merchantId,
        nominal: body.nominal,
      });
      const data = clientRes.data!;
      return new CreatePurchaseResponseDto({
        content: data.content,
        nominal: data.nominal,
        productCode: data.productCode,
        providerName: body.providerName,
        paymentMethodName: body.paymentMethodName,
      });
    }

    throw ResponseException.fromHttpExecption(
      new BadGatewayException('Provider Name Not Found'),
    );
  }

  async createCallbackProvider(dto: CreatePurchaseCallbackSystemDto) {
    console.log('callback');
    await this.prisma.$transaction(async (tx) => {
      /**
       * Get Fee Config
       */
      const feeDto =
        await this.feeCalculateClient.calculatePurchaseFeeConfigTCP({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      console.log({ feeDto });

      const agentIds: number[] = feeDto.agentFee.agents.map(
        (agent) => agent.id,
      );

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(dto.merchantId);
      const lastBalanceInternal =
        await this.balanceService.aggregateBalanceInternal();
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);

      /**
       * Create Purchase Transaction
       */
      const purchaseTransaction = await tx.purchaseTransaction.create({
        data: {
          code: dto.code,
          externalId: dto.externalId,
          // referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
          metadata: dto.metadata as Prisma.InputJsonValue,
          netNominal: feeDto.merchantFee.netNominal,
          status: dto.status as TransactionStatusEnum, /// TODO Masukin ke constant di transaction microservices
          MerchantBalanceLog: {
            create: {
              merchantId: dto.merchantId,
              changeAmount: dto.nominal,
              balancePending: lastBalanceMerchant.balancePending.plus(
                feeDto.merchantFee.netNominal,
              ),
              balanceActive: lastBalanceMerchant.balanceActive,
              transactionType: 'PURCHASE',
            },
          },
          InternalBalanceLog: {
            create: {
              changeAmount: feeDto.internalFee.nominal,
              balancePending: lastBalanceInternal.balancePending,
              merchantId: dto.merchantId,
              balanceActive: lastBalanceInternal.balanceActive?.plus(
                feeDto.internalFee.nominal,
              ),
              providerName: dto.providerName,
              paymentMethodName: dto.paymentMethodName,
              transactionType: 'PURCHASE',
            },
          },
          AgentBalanceLog: {
            createMany: {
              skipDuplicates: true,
              data: feeDto.agentFee.agents.map((item) => {
                return {
                  agentId: item.id,
                  changeAmount: item.nominal,
                  balanceActive:
                    lastBalanceAgents.find((a) => a.agentId == item.id)
                      ?.balanceActive || new Decimal(0),
                  balancePending:
                    lastBalanceAgents
                      .find((a) => a.agentId == item.id)
                      ?.balancePending.plus(item.nominal) || new Decimal(0),
                  transactionType: 'PURCHASE',
                };
              }),
            },
          },
        },
      });

      /**
       * Create Purchase Fee Detail
       */
      const purchaseFeeDetailManyInput: Prisma.PurchaseFeeDetailCreateManyInput[] =
        this.purchaseFeeDetailMapper({
          purchaseId: purchaseTransaction.id,
          feeDto,
        });
      const purchsaeFeeDetails = await tx.purchaseFeeDetail.createManyAndReturn(
        {
          data: purchaseFeeDetailManyInput,
        },
      );
      console.log({ purchaseTransaction, feeDto, purchsaeFeeDetails });
    });
    return;
  }

  private purchaseFeeDetailMapper({
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

// async handleWebhook(external_id: string, newStatus: string, rawPayload: any) {
//   const trx = await this.prisma.purchaseTransaction.findUnique({
//     where: { externalId: external_id },
//   });
//   if (!trx) throw new NotFoundException('Transaction not found'); // TODO

//   if (['SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(trx.status)) {
//     return { message: 'Transaction already finalized' };
//   }

//   const updated = await this.prisma.purchaseTransaction.update({
//     where: { externalId: external_id },
//     data: {
//       status: newStatus as any,
//       updatedAt: DateHelper.nowDate(),
//     },
//   });

//   await this.prisma.purchaseTransactionAudit.create({
//     data: {
//       transactionId: updated.id,
//       oldStatus: trx.status,
//       newStatus: newStatus as any,
//       source: 'webhook',
//       createdAt: DateHelper.nowDate(),
//     },
//   });

//   await this.prisma.webhookLog.create({
//     data: {
//       transactionId: updated.id,
//       source: 'provider',
//       payload: rawPayload,
//       receivedAt: DateHelper.nowDate(),
//     },
//   });

//   return { message: 'Webhook processed', status: updated.status };
// }
