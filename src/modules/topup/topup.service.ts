import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { TopupFeeDto } from '../fee/dto/topup-fee.dto';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { CreateTopupTransactionDto } from './dto/create-topup-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TopupTransactionDto } from './dto/topup-transaction.dto';
import { FeeDetailDto } from './dto/fee-details';
import Decimal from 'decimal.js';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class TopupTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  async createTopupTransaction(dto: CreateTopupTransactionDto) {
    await this.prisma.$transaction(async (trx) => {
      const topupFeeDto: TopupFeeDto =
        await this.feeCalculateService.calculateFeeConfig({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const topupTransaction = await trx.topUpTransaction.create({
        data: {
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          receiptImage: dto.receiptImage,
          nominal: dto.nominal,
          metadata: dto.metadata,
          netNominal: topupFeeDto.merchantFee.netNominal,
          status: 'PENDING',
        },
      });

      const topupFeeDetailCreateManyInput: Prisma.TopupFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          topupId: topupTransaction.id,
          topupFeeDto,
        });
      const topupFeeDetails = await trx.topupFeeDetail.createManyAndReturn({
        data: topupFeeDetailCreateManyInput,
      });

      console.log({ topupTransaction, topupFeeDto, topupFeeDetails });

      return;
    });
  }
  private feeDetailMapper({
    topupId,
    topupFeeDto,
  }: {
    topupId: number;
    topupFeeDto: TopupFeeDto;
  }): Prisma.TopupFeeDetailCreateManyInput[] {
    const result: Prisma.TopupFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = topupFeeDto;
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
      topupId,
      type: 'MERCHANT',
      isPercentage: true,
      fee: merchantFee.feePercentage,
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      topupId,
      type: 'PROVIDER',
      isPercentage: providerFee.isPercentage,
      fee: providerFee.fee,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      topupId,
      type: 'INTERNAL',
      isPercentage: internalFee.isPercentage,
      fee: internalFee.fee,
      nominal: internalFee.nominal,
    });

    /**
     * Agent
     */
    for (const agentFeeEach of agentFee.agents) {
      result.push({
        topupId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        isPercentage: true,
        fee: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return result;
  }

  async findOneThrow(id: number) {
    return this.prisma.topUpTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterTransactionDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;
    const { skip, take } = paging(pageable);

    const fromDate = from
      ? startOfDay(from.toJSDate())
      : subDays(DateHelper.nowDate(), 7);
    const toDate = to
      ? endOfDay(to.toJSDate())
      : endOfDay(DateHelper.nowDate());

    const whereClause: Prisma.TopUpTransactionWhereInput = {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (merchantId) whereClause.merchantId = merchantId;
    if (providerName) whereClause.providerName = providerName;
    if (status) whereClause.status = status;
    if (paymentMethodName) whereClause.paymentMethodName = paymentMethodName;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.topUpTransaction.count({
        where: whereClause,
      }),
      this.prisma.topUpTransaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          feeDetails: true,
        },
      }),
    ]);
    const data = items.map((item) => {
      return new TopupTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        feeDetails: item.feeDetails.map((fee) => {
          return new FeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<TopupTransactionDto>({
      data: data,
      pageable,
      total,
    });
  }

  async approveTopUp(transactionId: number) {
    await this.prisma.$transaction(async (trx) => {
      const topup = await trx.topUpTransaction.update({
        data: {
          status: 'SUCCESS',
        },
        where: {
          id: transactionId,
          status: 'PENDING',
        },
        select: {
          feeDetails: true,
          merchantId: true,
          id: true,
          netNominal: true,
        },
      });

      const agentIds: number[] = topup.feeDetails
        .map((feeDetail) => feeDetail.agentId as number | null)
        .filter<number>((agentId) => agentId !== null);

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(topup.merchantId);
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);

      await trx.merchantBalanceLog.create({
        data: {
          merchantId: topup.merchantId,
          topupId: topup.id,
          changeAmount: topup.netNominal,
          balanceActive: lastBalanceMerchant.balanceActive.plus(
            topup.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
          transactionType: 'TOPUP',
        },
      });
      for (const feeDetail of topup.feeDetails) {
        if (feeDetail.type !== 'AGENT' || feeDetail.agentId === null) continue;

        /**
         * Get the last Agent Balance
         */

        /**
         * Update Agent Balance
         */
        await trx.agentBalanceLog.create({
          data: {
            agentId: feeDetail.agentId,
            topupId: topup.id,
            changeAmount: feeDetail.nominal,
            balancePending:
              lastBalanceAgents.find((a) => a.agentId == feeDetail.agentId)
                ?.balancePending || new Decimal(0),
            balanceActive:
              lastBalanceAgents
                .find((a) => a.agentId == feeDetail.agentId)
                ?.balanceActive.plus(feeDetail.nominal) || new Decimal(0),
            transactionType: 'TOPUP',
          },
        });
      }
    });
  }

  async rejectTopup(transactionId: number) {
    await this.prisma.topUpTransaction.update({
      data: {
        status: 'FAILED',
      },
      where: {
        id: transactionId,
        status: 'PENDING',
      },
      select: {
        feeDetails: true,
        merchantId: true,
        id: true,
        netNominal: true,
      },
    });
  }
}
