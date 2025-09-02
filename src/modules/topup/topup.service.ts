import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { CreateTopupTransactionDto } from './dto/create-topup-transaction.dto';
import { FilterTopupDto } from './dto/filter-topup.dto';
import { TopupTransactionDto } from './dto/topup-transaction.dto';
import Decimal from 'decimal.js';
import { BalanceService } from '../balance/balance.service';
import { TopupFeeSystemDto } from '../fee/dto-transaction-system/topup-fee.system.dto';
import { TopupFeeDetailDto } from './dto/topup-fee-detail.dto';

@Injectable()
export class TopupTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  async createTopupTransaction(dto: CreateTopupTransactionDto) {
    /// TODO Ambil dari JWT token
    const merchantId = 1;

    /// TODO URL Path dari Minio
    const receiptImage = 'image.png';

    /// TODO Readme
    /**
     * Alur top up ini harus update sih
     * Suggestion:
     * - Merchant melakukan TopUp input nominal dan receipt image
     * - Kedua data itu disimpan pada table terpisah (TopUpMerchantDraft)
     * - Admin akan melakukan identifikasi manual berdasarkan receipt image
     * - Admin melakukan input berdasarkan table TopUpTransaction dan etc
     * - Jika tidak valid, maka TopUpMerchantDraft ubah status menjadi INVALID
     *
     * - Table TopUpMerchantDraft
     *   - merchantId
     *   - Receipt Image
     *   - TopUpMerchantDraftEnum
     *   - createdAt ... etc
     * - Enum TopUpMerchantDraftEnum
     * - Table TopUpTransaction
     *   - Tambah FK ke TopUpMerchantDraft
     */

    await this.prisma.$transaction(async (trx) => {
      const feeDto = await this.feeCalculateService.calculateTopupFeeConfigTCP({
        merchantId,
        providerName: 'NETZME',
        paymentMethodName: 'TRANSFERBANK',
        nominal: dto.nominal,
      });

      const topupTransaction = await trx.topUpTransaction.create({
        data: {
          externalId: 'external id faker',
          referenceId: 'reference id faker',
          merchantId,
          providerName: 'NETZME',
          paymentMethodName: 'TRANSFERBANK',
          receiptImage: receiptImage,
          nominal: dto.nominal,
          metadata: {},
          netNominal: feeDto.merchantFee.netNominal,
          status: 'PENDING',
        },
      });

      const topupFeeDetailCreateManyInput: Prisma.TopupFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          topupId: topupTransaction.id,
          feeDto,
        });
      const topupFeeDetails = await trx.topupFeeDetail.createManyAndReturn({
        data: topupFeeDetailCreateManyInput,
      });

      console.log({ topupTransaction, feeDto, topupFeeDetails });

      return;
    });
  }
  private feeDetailMapper({
    topupId,
    feeDto,
  }: {
    topupId: number;
    feeDto: TopupFeeSystemDto;
  }): Prisma.TopupFeeDetailCreateManyInput[] {
    const result: Prisma.TopupFeeDetailCreateManyInput[] = [];
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
      topupId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      topupId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      topupId,
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
        topupId,
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
    return this.prisma.topUpTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterTopupDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

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

    const { skip, take } = paging(pageable);
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
          return new TopupFeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<TopupTransactionDto>({
      pageable,
      total,
      data: data,
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
        .map((feeDetail) => feeDetail.agentId)
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
