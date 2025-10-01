import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { SettlementInternalDto } from './dto/settlement-internal.dto';
import { BalanceService } from '../balance/balance.service';
import { FilterSettlementDto } from './dto/filter-settlement.dto';
import { Prisma, TransactionStatusEnum } from '@prisma/client';
import { DateHelper } from 'src/shared/helper/date.helper';
import { PurchaseTransactionDto } from '../purchase/dto/purchase-transaction.dto';
import { FilterUnsettlementDto } from './dto/filter-unsettlement.dto';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { PurchaseFeeDetailDto } from '../purchase/dto/purchase-fee-detail.dto';
import { DisbursementTransactionDto } from '../disbursement/dto/disbursement-transaction.dto';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { WithdrawTransactionDto } from '../withdraw/dto/withdraw-transaction.dto';
import { TopupSettlementDto } from './dto/top-up-settlement.dto';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';

@Injectable()
export class SettlementService {
  constructor(
    @Inject(PRISMA_SERVICE) private readonly prisma: PrismaClient,
    private balanceService: BalanceService,
    @Inject('SETTLE_RECON_SERVICE') private readonly settleClient: ClientProxy, // TODO Pake WebClient
  ) {}

  async findAllSettlement(pageable: Pageable, filter: FilterSettlementDto) {
    const { merchantId, from, to } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};

    whereClause.status = TransactionStatusEnum.SUCCESS;
    whereClause.settlementAt = { not: null };
    if (merchantId) whereClause.merchantId = merchantId;

    if (from && to) {
      whereClause.createdAt = {
        gte: from.toJSDate(),
        lte: to.toJSDate(),
      };
    }

    const { skip, take } = paging(pageable);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.count({ where: whereClause }),
      this.prisma.purchaseTransaction.findMany({
        skip,
        take,
        include: { feeDetails: true },
        where: whereClause,
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

  async settlementDisbursement(filter: DisbursementTransactionDto) {
    try {
      const res = await firstValueFrom(
        this.settleClient.send({ cmd: 'settlement_disbursement' }, filter),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async settlementTopup(filter: TopupSettlementDto) {
    try {
      const res = await firstValueFrom(
        this.settleClient.send({ cmd: 'settlement_topup' }, filter),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async settlementWithdraw(filter: WithdrawTransactionDto) {
    try {
      const res = await firstValueFrom(
        this.settleClient.send({ cmd: 'settlement_withdraw' }, filter),
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAllUnsettlement(pageable: Pageable, filter: FilterUnsettlementDto) {
    const { merchantId } = filter;

    const whereClause: Prisma.PurchaseTransactionWhereInput = {};
    whereClause.status = TransactionStatusEnum.SUCCESS;

    whereClause.settlementAt = null;
    if (merchantId) whereClause.merchantId = merchantId;

    const { skip, take } = paging(pageable);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.purchaseTransaction.count({ where: whereClause }),
      this.prisma.purchaseTransaction.findMany({
        skip,
        take,
        include: { feeDetails: true },
        where: whereClause,
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

  async internalSettlement(body: UpdateSettlementInternalDto) {
    const { date: now, merchantIds, interval } = body;
    /**
     * For tracking merchant that skip settlement during that interval
     * Cause:
     *  - Already manual settlement by Admin itself
     *  - No Transaction during interval
     */
    const merchantIdNoSettlement: number[] = [];

    const merchantIdSettlement: number[] = [];

    /**
     * Update Many Balance of Merchants and Agents
     */
    for (const merchantId of merchantIds) {
      /**
       * It will start SQL Transaction consist of begin, commit and rollback for eact merchantId
       */
      await this.prisma.$transaction(async (tx) => {
        /**
         * Find Purchase Transaction by merchantId and Not Settlement yet
         */
        const purchaseTransactions = await tx.purchaseTransaction.findMany({
          where: { settlementAt: null, merchantId: merchantId },
          include: {
            feeDetails: true,
          },
        });

        if (!purchaseTransactions || purchaseTransactions.length === 0) {
          merchantIdNoSettlement.push(merchantId);
          return; /// Continue to next merchant
        }

        /**
         * Get the last Merchant Balance
         */
        /// TODO lastBalanceAllAgent must find specific agentIds
        const lastBalanceMerchant =
          await this.balanceService.checkBalanceMerchant(merchantId);
        const lastBalanceInternal =
          await this.balanceService.aggregateBalanceInternal();
        const lastBalanceAllAgent =
          await this.balanceService.checkBalanceAllAgent();

        for (const purchase of purchaseTransactions) {
          /**
           * Merchant Balance
           */
          await tx.merchantBalanceLog.create({
            data: {
              merchantId,
              purchaseId: purchase.id,
              changeAmount: purchase.netNominal,
              balancePending: lastBalanceMerchant.balancePending.minus(
                purchase.netNominal,
              ),
              balanceActive: lastBalanceMerchant.balanceActive.plus(
                purchase.netNominal,
              ), // last balance + netNominal
              transactionType: 'SETTLEMENT_PURCHASE',
            },
          });

          /// TODO Internal Balance
          await tx.internalBalanceLog.create({
            data: {
              purchaseId: purchase.id,
              merchantId,
              changeAmount: purchase.netNominal,
              balancePending: lastBalanceInternal.balancePending.minus(
                purchase.netNominal,
              ),
              balanceActive: lastBalanceInternal.balanceActive.plus(
                purchase.netNominal,
              ),
              transactionType: 'SETTLEMENT_PURCHASE',
              providerName: purchase.providerName,
              paymentMethodName: purchase.paymentMethodName,
            },
          });

          /**
           * Agent Balance
           */
          for (const feeDetail of purchase.feeDetails) {
            const lastBalanceAgent = lastBalanceAllAgent.find(
              (item) => item.agentId == feeDetail.agentId,
            );
            /**
             * Filter feeDetail Agent Only
             */
            if (feeDetail.type !== 'AGENT' || feeDetail.agentId === null)
              continue;

            /**
             * Update Agent Balance
             */
            await tx.agentBalanceLog.create({
              data: {
                agentId: feeDetail.agentId,
                purchaseId: purchase.id,
                changeAmount: feeDetail.nominal,
                balanceActive:
                  lastBalanceAgent?.balanceActive.plus(feeDetail.nominal) ||
                  new Decimal(0),
                balancePending:
                  lastBalanceAgent?.balancePending.minus(feeDetail.nominal) ||
                  new Decimal(0),
                transactionType: 'SETTLEMENT_PURCHASE',
              },
            });
          }

          /**
           * Mark purchaseTransaction that has been Settlement
           */
          await tx.purchaseTransaction.update({
            where: {
              id: purchase.id,
            },
            data: {
              settlementAt: now.toJSDate(),
            },
          });

          merchantIdSettlement.push(merchantId);
          console.log(merchantIdSettlement);
        }
      });
    }

    const settlementInternalDto = new SettlementInternalDto({
      merchantIds: merchantIdSettlement,
      merchantIdsNoSettlement: merchantIdNoSettlement,
    });

    if (merchantIdNoSettlement.length === 0)
      return new ResponseDto<SettlementInternalDto>({
        status: ResponseStatus.SUCCESS,
        data: settlementInternalDto,
      });

    return new ResponseDto<SettlementInternalDto>({
      status: ResponseStatus.PARTIAL_SUCCESS,
      message: `Some merchant already settlement or no transaction during internal ${interval}`,
      data: settlementInternalDto,
    });
  }
}