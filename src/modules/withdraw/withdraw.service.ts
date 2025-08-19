import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { FeeDetailDto } from './dto/fee-details';
import { CreateWithdrawTransactionDto } from './dto/create-withdraw-transaction.dto';
import { WithdrawFeeDto } from '../fee/dto/withdraw-fee.dto';
import { WithdrawTransactionDto } from './dto/withdraw-transaction.dto';

@Injectable()
export class WithdrawTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
  ) {}

  async checkBalanceMerchant(merchantId: number) {
    const lastRow = await this.prisma.merchantBalanceLog.findFirst({
      where: {
        merchantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async checkBalanceAgent(agentId: number) {
    const lastRow = await this.prisma.agentBalanceLog.findFirst({
      where: {
        agentId,
      },
      orderBy: {
        createdAt: 'desc',
        id: 'desc',
      },
    });
    return lastRow?.balanceAfter;
  }

  async createWithdrawTransaction(dto: CreateWithdrawTransactionDto) {
    const balance = await this.checkBalanceMerchant(dto.merchantId);
    if (balance && balance <= dto.netNominal) {
      throw new Error('Balance Tidak Mencukupi');
    }
    await this.prisma.$transaction(async (trx) => {
      const withdrawFeeDto: WithdrawFeeDto =
        await this.feeCalculateService.calculateFeeConfig({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const withdrawTransaction = await trx.withdrawTransaction.create({
        data: {
          externalId: dto.externalId,
          referenceId: dto.referenceId,
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
          metadata: dto.metadata,
          netNominal: withdrawFeeDto.merchantFee.netNominal,
          status: 'PENDING',
        },
      });

      const withdrawFeeDetailCreateManyInput: Prisma.WithdrawFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          withdrawTransactionId: withdrawTransaction.id,
          withdrawFeeDto,
        });
      const withdrawFeeDetails =
        await trx.withdrawFeeDetail.createManyAndReturn({
          data: withdrawFeeDetailCreateManyInput,
        });

      console.log({
        withdrawTransaction,
        withdrawFeeDto,
        withdrawFeeDetails,
      });

      return;
    });
  }
  private feeDetailMapper({
    withdrawTransactionId,
    withdrawFeeDto,
  }: {
    withdrawTransactionId: string;
    withdrawFeeDto: WithdrawFeeDto;
  }): Prisma.WithdrawFeeDetailCreateManyInput[] {
    const result: Prisma.WithdrawFeeDetailCreateManyInput[] = [];
    const { merchantFee, agentFee, providerFee, internalFee } = withdrawFeeDto;
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
      withdrawTransactionId,
      type: 'MERCHANT',
      isPercentage: true,
      fee: merchantFee.feePercentage,
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      withdrawTransactionId,
      type: 'PROVIDER',
      isPercentage: providerFee.isPercentage,
      fee: providerFee.fee,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      withdrawTransactionId,
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
        withdrawTransactionId,
        type: 'AGENT',
        agentId: agentFeeEach.id,
        isPercentage: true,
        fee: agentFeeEach.feePercentage,
        nominal: agentFeeEach.nominal,
      });
    }

    return result;
  }

  async findOneThrow(id: string) {
    return this.prisma.withdrawTransaction.findUniqueOrThrow({
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

    const whereClause: Prisma.WithdrawTransactionWhereInput = {
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
      this.prisma.withdrawTransaction.count({
        where: whereClause,
      }),
      this.prisma.withdrawTransaction.findMany({
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
      return new WithdrawTransactionDto({
        ...item,
        metadata: item.metadata as Record<string, unknown>,
        feeDetails: item.feeDetails.map((fee) => {
          return new FeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<WithdrawTransactionDto>({
      data: data,
      pageable,
      total,
    });
  }
}
