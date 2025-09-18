import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
import { WithdrawFeeDetailDto } from './dto/withdraw-fee-detail.dto';
import { UuidHelper } from 'src/shared/helper/uuid.helper';
import { FeeCalculateClient } from 'src/microservice/config/fee-calculate.client';
import { WithdrawFeeSystemDto } from 'src/microservice/config/dto-transaction-system/withdraw-fee.system.dto';

@Injectable()
export class WithdrawService {
  constructor(
    private prisma: PrismaService,
    private readonly feeCalculateClient: FeeCalculateClient,
    private balanceService: BalanceService,
  ) {}

  async create(dto: CreateWithdrawTransactionDto) {
    const merchantId = dto.merchantId;
    await this.prisma.$transaction(async (trx) => {
      const feeDto =
        await this.feeCalculateClient.calculateWithdrawFeeConfigTCP({
          merchantId,
          providerName: 'NETZME',
          paymentMethodName: 'TRANSFERBANK',
          nominal: dto.nominal,
        });

      const agentIds: number[] = feeDto.agentFee.agents.map(
        (agent) => agent.id,
      );

      const lastBalanceMerchant =
        await this.balanceService.checkBalanceMerchant(merchantId);
      const lastBalanceInternal =
        await this.balanceService.aggregateBalanceInternal();
      const lastBalanceAgents =
        await this.balanceService.checkBalanceAgents(agentIds);

      // if (lastBalanceMerchant.balanceActive <= dto.netNominal) {
      //   throw new Error('Balance Tidak Mencukupi');
      // }

      /// TODO ResponseException ValidityLogic (statusCode: 419 / 422 / 400)
      if (lastBalanceMerchant.balanceActive <= dto.nominal) {
        throw new Error('Balance Tidak Mencukupi');
      }

      const withdrawTransaction = await trx.withdrawTransaction.create({
        data: {
          externalId: 'external id faker',
          referenceId: UuidHelper.v4(),
          merchantId,
          providerName: 'NETZME',
          paymentMethodName: 'TRANSFERBANK',
          nominal: dto.nominal,
          metadata: {},
          netNominal: feeDto.merchantFee.netNominal,
          status: 'PENDING',
          MerchantBalanceLog: {
            create: {
              merchantId: merchantId,
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
              merchantId: merchantId,
              balanceActive: lastBalanceInternal.balanceActive?.plus(
                feeDto.internalFee.nominal,
              ),
              providerName: 'NETZME',
              paymentMethodName: 'TRANSFERBANK',
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

    const withdrawDtos: WithdrawTransactionDto[] = [];
    for (const item of items) {
      let totalFeeCut = new Decimal(0);
      const feeDetailDtos: WithdrawFeeDetailDto[] = [];
      for (const feeDetail of item.feeDetails) {
        totalFeeCut = totalFeeCut.plus(feeDetail.nominal);
        feeDetailDtos.push(new WithdrawFeeDetailDto({ ...feeDetail }));
      }
      withdrawDtos.push(
        new WithdrawTransactionDto({
          ...item,
          totalFeeCut,
          metadata: item.metadata as Record<string, unknown>,
          feeDetails: feeDetailDtos,
        }),
      );
    }

    return new Page<WithdrawTransactionDto>({
      pageable,
      total,
      data: withdrawDtos,
    });
  }
}
