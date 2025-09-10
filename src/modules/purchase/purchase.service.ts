import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { CreatePurchaseTransactionDto } from './dto/create-purchase-transaction.dto';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseTransactionDto } from './dto/purchase-transaction.dto';
import { ResponseException } from 'src/exception/response.exception';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';
import { PurchaseFeeSystemDto } from '../fee/dto-transaction-system/purchase-fee.system.dto';
import { PurchaseFeeDetailDto } from './dto/purchase-fee-detail.dto';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  hello() {
    return 'This is purchase service';
  }

  async create(dto: CreatePurchaseTransactionDto) {
    console.log({ dto });
    await this.prisma.$transaction(async (tx) => {
      /**
       * Get Fee Config
       */
      const feeDto =
        await this.feeCalculateService.calculatePurchaseFeeConfigTCP({
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
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
          metadata: dto.metadata,
          netNominal: feeDto.merchantFee.netNominal,
          status: 'PENDING',
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

      return;
    });
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
