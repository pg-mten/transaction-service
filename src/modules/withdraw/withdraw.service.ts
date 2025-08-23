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
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';

@Injectable()
export class WithdrawTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  async createWithdrawTransaction(dto: CreateWithdrawTransactionDto) {
    await this.prisma.$transaction(async (trx) => {
      const withdrawFeeDto: WithdrawFeeDto =
        await this.feeCalculateService.calculateFeeConfig({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const agentIds: number[] = withdrawFeeDto.agentFee.agents.map(
        (agent) => agent.id,
      );

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(dto.merchantId);
      const lastBalanceInternal =
        await this.balanceService.checkBalanceInternal();
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);

      if (lastBalanceMerchant.balanceActive <= dto.netNominal) {
        throw new Error('Balance Tidak Mencukupi');
      }

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
          MerchantBalanceLog: {
            create: {
              merchantId: dto.merchantId,
              changeAmount: dto.nominal,
              balanceActive: lastBalanceMerchant.balanceActive?.minus(
                withdrawFeeDto.merchantFee.netNominal,
              ),
              balancePending: lastBalanceMerchant.balancePending,
              transactionType: 'WITHDRAW',
            },
          },
          InternalBalanceLog: {
            create: {
              changeAmount: withdrawFeeDto.internalFee.fee,
              balancePending: lastBalanceInternal.balancePending,
              merchantId: dto.merchantId,
              balanceActive: lastBalanceInternal.balanceActive?.plus(
                withdrawFeeDto.internalFee.fee,
              ),
              providerName: dto.providerName,
              paymentMethodName: dto.paymentMethodName,
              transactionType: 'WITHDRAW',
            },
          },
          AgentBalanceLog: {
            createMany: {
              skipDuplicates: true,
              data: withdrawFeeDto.agentFee.agents.map((item) => {
                return {
                  agentId: item.id,
                  changeAmount: item.nominal,
                  balancePending:
                    lastBalanceAgents.find((a) => a.agentId == item.id)
                      ?.balancePending || new Decimal(0),
                  balanceActive:
                    lastBalanceAgents
                      .find((a) => a.agentId == item.id)
                      ?.balanceActive.plus(item.nominal) || new Decimal(0),
                  transactionType: 'WITHDRAW',
                };
              }),
            },
          },
        },
      });

      const withdrawFeeDetailCreateManyInput: Prisma.WithdrawFeeDetailCreateManyInput[] =
        this.feeDetailMapper({
          withdrawId: withdrawTransaction.id,
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
    withdrawId,
    withdrawFeeDto,
  }: {
    withdrawId: number;
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
      withdrawId,
      type: 'MERCHANT',
      isPercentage: true,
      fee: merchantFee.feePercentage,
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      withdrawId,
      type: 'PROVIDER',
      isPercentage: providerFee.isPercentage,
      fee: providerFee.fee,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      withdrawId,
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
        withdrawId,
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
