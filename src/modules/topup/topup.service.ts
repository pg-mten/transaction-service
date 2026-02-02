import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/shared/exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { CreateTopupTransactionDto } from './dto/create-topup-transaction.dto';
import { FilterTopupDto } from './dto/filter-topup.dto';
import { TopupTransactionDto } from './dto/topup-transaction.dto';
import Decimal from 'decimal.js';
import { BalanceService } from '../balance/balance.service';
import { TopupFeeDetailDto } from './dto/topup-fee-detail.dto';
import { UuidHelper } from 'src/shared/helper/uuid.helper';
import { ApproveTopupTransactionDto } from './dto/approve-topup-transaction.dto';
import { RejectTopupTransactionDto } from './dto/reject-topup-transaction.dto';
import { TopupFeeSystemDto } from 'src/microservice/config/dto-transaction-system/topup-fee.system.dto';
import { FeeCalculateConfigClient } from 'src/microservice/config/fee-calculate.config.client';
import { PRISMA_SERVICE } from '../prisma/prisma.provider';

@Injectable()
export class TopupService {
  constructor(
    @Inject(PRISMA_SERVICE) private prisma: PrismaClient,
    private readonly feeCalculateClient: FeeCalculateConfigClient,
    private balanceService: BalanceService,
  ) {}

  async create(dto: CreateTopupTransactionDto) {
    const merchantId = dto.merchantId;

    /// TODO URL Path dari Minio
    const receiptImage = dto.receiptImage ?? 'www.google.com';
    console.log({ dto });

    await this.prisma.$transaction(async (trx) => {
      const feeDto = await this.feeCalculateClient.calculateTopupFeeConfigTCP({
        merchantId,
        providerName: 'INTERNAL',
        paymentMethodName: 'TRANSFERBANK',
        nominal: dto.nominal,
      });

      const topupTransaction = await trx.topUpTransaction.create({
        data: {
          externalId: 'external id faker',
          referenceId: UuidHelper.v4(),
          merchantId,
          providerName: 'INTERNAL',
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

  async approveTopUp(dto: ApproveTopupTransactionDto) {
    const { topupId } = dto;
    console.log('approveTopUp');
    const topupDto = await this.prisma.$transaction(async (trx) => {
      const item = await trx.topUpTransaction.update({
        data: {
          status: 'SUCCESS',
        },
        where: {
          id: topupId,
          status: 'PENDING',
        },
        include: { feeDetails: true },
      });
      console.log({ item });
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: TopupFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new TopupFeeDetailDto({ ...feeDetail }));
      }

      const topupDto = new TopupTransactionDto({
        ...item,
        totalFeeCut,
        metadata: item.metadata as Record<string, unknown>,
        feeDetails: feeDetailDtos,
      });
      console.log({ topupDto });

      // await this.settlementService.settlementTopup(topup);
      await this.settlementTopup(topupDto);
      return topupDto;
    });
    console.log({ topupDto });

    /// TODO Reduce Deadlock
    // this.settlementService
    //   .settlementTopup(topup)
    //   .then(() => {})
    //   .catch(() => {
    //     /// Update topup untuk jadi Pending / Failed lagi sesuai bisnis process
    //     const topup = this.prisma.$transaction(async (trx) => {
    //       const topup = await trx.topUpTransaction.update({
    //         data: {
    //           status: 'PENDING',
    //         },
    //         where: {
    //           id: transactionId,
    //           status: 'SUCCESS',
    //         },
    //         select: {
    //           merchantId: true,
    //           id: true,
    //           netNominal: true,
    //           feeDetails: true,
    //           providerName: true,
    //           paymentMethodName: true,
    //           nominal: true,
    //         },
    //       });
    //       return topup;
    //     });
    //   });
    return;
  }

  async settlementTopup(topupDto: TopupTransactionDto) {
    console.log('settlementTopup');
    console.log({ topupDto });
    await this.prisma.$transaction(async (trx) => {
      const agentIds: number[] = topupDto.feeDetails
        .map((feeDetail) => feeDetail.agentId)
        .filter<number>((agentId) => agentId !== null);

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(topupDto.merchantId);
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);
      const lastBalanceInternal =
        await this.balanceService.checkBalanceInternal();

      console.log({
        lastBalanceMerchant,
        lastBalanceAgents,
        lastBalanceInternal,
      });

      await trx.merchantBalanceLog.create({
        data: {
          merchantId: topupDto.merchantId,
          topupId: topupDto.id,
          changeAmount: topupDto.netNominal,
          balanceActive: lastBalanceMerchant.balanceActive.plus(
            topupDto.netNominal,
          ),
          balancePending: lastBalanceMerchant.balancePending,
          transactionType: 'TOPUP',
        },
      });
      for (const feeDetail of topupDto.feeDetails) {
        if (feeDetail.type == 'INTERNAL') {
          await trx.internalBalanceLog.create({
            data: {
              topupId: topupDto.id,
              changeAmount: feeDetail.nominal,
              balancePending: lastBalanceInternal.balancePending,
              balanceActive: lastBalanceInternal.balanceActive.plus(
                feeDetail.nominal,
              ),
              merchantId: topupDto.merchantId,
              providerName: topupDto.providerName,
              paymentMethodName: topupDto.paymentMethodName,
              transactionType: 'TOPUP',
            },
          });
        }
        if (feeDetail.type == 'AGENT' && feeDetail.agentId !== null) {
          await trx.agentBalanceLog.create({
            data: {
              agentId: feeDetail.agentId,
              topupId: topupDto.id,
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
      }
    });
    return;
  }

  async rejectTopup(dto: RejectTopupTransactionDto) {
    const { topupId } = dto;
    await this.prisma.topUpTransaction.update({
      data: {
        status: 'FAILED',
      },
      where: {
        id: topupId,
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
