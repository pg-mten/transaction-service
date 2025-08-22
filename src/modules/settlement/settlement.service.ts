import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { SettlementInternalDto } from './dto/settlement-internal.dto';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class SettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private balanceService: BalanceService,
  ) {}

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
        const lastBalanceMerchant =
          await this.balanceService.checkBalanceMerchant(merchantId);
        const lastBalanceInternal =
          await this.balanceService.checkBalanceInternal();
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
              balancePending: lastBalanceMerchant.pending.minus(
                purchase.netNominal,
              ),
              balanceActive: lastBalanceMerchant.active.plus(
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
              balancePending: lastBalanceInternal.pending.minus(
                purchase.netNominal,
              ),
              balanceActive: lastBalanceInternal.active.plus(
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
