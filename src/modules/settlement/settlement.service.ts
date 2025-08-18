import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';
import { UpdateSettlementInternalDto } from './dto/update-settlement-internal.dto';
import { ResponseDto, ResponseStatus } from 'src/shared/response.dto';
import { SettlementInternalDto } from './dto/settlement-internal.dto';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

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
        const lastBalanceMerchantLog = await tx.merchantBalanceLog.findFirst({
          where: { merchantId },
          orderBy: {
            createdAt: 'desc',
          },
        });
        const merchantLastBalance =
          lastBalanceMerchantLog?.balanceAfter ?? new Decimal(0);

        for (const purchase of purchaseTransactions) {
          /**
           * Merchant Balance
           */
          await tx.merchantBalanceLog.create({
            data: {
              merchantId,
              purchaseId: purchase.id,
              changeAmount: purchase.netNominal,
              balanceAfter: merchantLastBalance.plus(purchase.netNominal), // last balance + netNominal
              reason: `PURCHASE SETTLEMENT BY SYSTEM`,
            },
          });

          /// TODO Internal Balance

          /**
           * Agent Balance
           */
          for (const feeDetail of purchase.feeDetails) {
            /**
             * Filter feeDetail Agent Only
             */
            if (feeDetail.type !== 'AGENT' || feeDetail.agentId === null)
              continue;

            const lastAgentBalanceLog = await tx.agentBalanceLog.findFirst({
              where: {
                agentId: feeDetail.agentId,
              },
              orderBy: {
                createdAt: 'desc',
              },
            });

            /**
             * Get the last Agent Balance
             */
            const agentLastBalance =
              lastAgentBalanceLog?.balanceAfter ?? new Decimal(0);

            /**
             * Update Agent Balance
             */
            await tx.agentBalanceLog.create({
              data: {
                agentId: feeDetail.agentId,
                purchaseId: purchase.id,
                changeAmount: feeDetail.nominal,
                balanceAfter: agentLastBalance.plus(feeDetail.nominal),
                reason: 'PURCHASE SETTLEMENT BY SYSTEM',
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
