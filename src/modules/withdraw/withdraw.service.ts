import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeCalculateService } from '../fee/fee-calculate.service';
import { Prisma } from '@prisma/client';
import { Page, Pageable, paging } from 'src/shared/pagination/pagination';
import { ResponseException } from 'src/exception/response.exception';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateHelper } from 'src/shared/helper/date.helper';
import { FilterWithdrawDto } from './dto/filter-withdraw.dto';
import { CreateWithdrawTransactionDto } from './dto/create-withdraw-transaction.dto';
import { WithdrawTransactionDto } from './dto/withdraw-transaction.dto';
import { BalanceService } from '../balance/balance.service';
import Decimal from 'decimal.js';
import { WithdrawFeeSystemDto } from '../fee/dto-transaction-system/withdraw-fee.system.dto';
import { WithdrawFeeDetailDto } from './dto/withdraw-fee-detail.dto';

@Injectable()
export class WithdrawTransactionService {
  constructor(
    private prisma: PrismaService,
    private feeCalculateService: FeeCalculateService,
    private balanceService: BalanceService,
  ) {}

  async createWithdrawTransaction(dto: CreateWithdrawTransactionDto) {
    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateService.calculateWithdrawFeeConfigTCP({
          merchantId: dto.merchantId,
          providerName: dto.providerName,
          paymentMethodName: dto.paymentMethodName,
          nominal: dto.nominal,
        });

      const agentIds: number[] = feeDto.agentFee.agents.map(
        (agent) => agent.id,
      );

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(dto.merchantId);
      const lastBalanceInternal =
        await this.balanceService.aggregateBalanceInternal();
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
          netNominal: feeDto.merchantFee.netNominal,
          status: 'PENDING',
          MerchantBalanceLog: {
            create: {
              merchantId: dto.merchantId,
              changeAmount: dto.nominal,
              balanceActive: lastBalanceMerchant.balanceActive?.minus(
                feeDto.merchantFee.netNominal,
              ),
              balancePending: lastBalanceMerchant.balancePending,
              transactionType: 'WITHDRAW',
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
              transactionType: 'WITHDRAW',
            },
          },
          AgentBalanceLog: {
            createMany: {
              skipDuplicates: true,
              data: feeDto.agentFee.agents.map((item) => {
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
          feeDto,
        });
      const withdrawFeeDetails =
        await trx.withdrawFeeDetail.createManyAndReturn({
          data: withdrawFeeDetailCreateManyInput,
        });

      console.log({
        withdrawTransaction,
        feeDto,
        withdrawFeeDetails,
      });

      return;
    });
  }
  private feeDetailMapper({
    withdrawId,
    feeDto,
  }: {
    withdrawId: number;
    feeDto: WithdrawFeeSystemDto;
  }): Prisma.WithdrawFeeDetailCreateManyInput[] {
    const result: Prisma.WithdrawFeeDetailCreateManyInput[] = [];
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
      withdrawId,
      type: 'MERCHANT',
      feePercentage: merchantFee.feePercentage,
      feeFixed: new Decimal(0),
      nominal: merchantFee.netNominal,
    });

    /**
     * Provider
     */
    result.push({
      withdrawId,
      type: 'PROVIDER',
      feeFixed: providerFee.feeFixed,
      feePercentage: providerFee.feePercentage,
      nominal: providerFee.nominal,
    });

    /**
     * Internal
     */
    result.push({
      withdrawId,
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
        withdrawId,
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
    return this.prisma.withdrawTransaction.findUniqueOrThrow({
      where: { id },
      include: {
        feeDetails: true,
      },
    });
  }

  async findAll(pageable: Pageable, query: FilterWithdrawDto) {
    const { from, to, merchantId, providerName, paymentMethodName, status } =
      query;

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

    const { skip, take } = paging(pageable);
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
          return new WithdrawFeeDetailDto({ ...fee });
        }),
      });
    });
    return new Page<WithdrawTransactionDto>({
      pageable,
      total,
      data: data,
    });
  }
}
