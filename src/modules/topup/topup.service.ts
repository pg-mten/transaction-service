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
import { SettlementService } from '../settlement/settlement.service';

@Injectable()
export class TopupTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
    private settlementService: SettlementService,
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

    const topupDtos: TopupTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: TopupFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new TopupFeeDetailDto({ ...feeDetail }));
      }
      topupDtos.push(
        new TopupTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<TopupTransactionDto>({
      pageable,
      total,
      data: topupDtos,
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
          merchantId: true,
          id: true,
          netNominal: true,
          feeDetails: true,
          providerName: true,
          paymentMethodName: true,
          nominal: true,
        },
      });
      await this.settlementService.settlementTopup(topup);
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
